import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useTranslation } from 'react-i18next';
import {
    Mic, MicOff, Video, VideoOff,
    Loader2, Layout, Clock, Calendar, X,
    ShieldCheck, Plus, Check, Users, Disc, StopCircle
} from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { userService } from '@/features/users/userService';
import { useAuthStore } from '../../auth/useAuthStore';
import type { User } from '@/types';

export const LiveMeeting = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('common');
    const { id: scheduledMeetingId } = useParams<{ id?: string }>();
    const [step, setStep] = useState<'setup' | 'meeting'>('setup');

    // Setup Form
    const [title, setTitle] = useState('');
    const [scheduledMeetingDate, setScheduledMeetingDate] = useState<Date | null>(null);
    const [isBeforeScheduledTime, setIsBeforeScheduledTime] = useState(false);

    // Initial Media State (for Lobby preview only)
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Loading Status
    const [loadingStatus, setLoadingStatus] = useState({
        meeting: 'pending' as 'pending' | 'success' | 'error',
    });

    const [isOrganizer, setIsOrganizer] = useState(false);

    // Participant Selection for Instant Meeting
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInvite, setShowInvite] = useState(false);

    const { user: currentUser } = useAuthStore();

    // Load users for invitation
    useEffect(() => {
        userService.getAll().then(users => {
            if (currentUser?.email) {
                setAvailableUsers(users.filter(u => u.email !== currentUser.email));
            }
        }).catch(console.error);
    }, [currentUser]);

    // Load scheduled meeting data
    useEffect(() => {
        if (scheduledMeetingId) {
            meetingService.getMeeting(scheduledMeetingId)
                .then(meeting => {
                    // BLOCKER: If meeting is completed, prevent re-entry
                    if ((meeting.status as string) === 'COMPLETED') {
                        navigate(`/meetings/${scheduledMeetingId}`);
                        return;
                    }

                    setTitle(meeting.title);

                    // Store scheduled meeting date
                    const meetingDate = new Date(meeting.date);
                    setScheduledMeetingDate(meetingDate);
                    setLoadingStatus(prev => ({ ...prev, meeting: 'success' }));

                    // Check if current time is before scheduled time
                    const now = new Date();
                    setIsBeforeScheduledTime(now < meetingDate);

                    // Check if organizer
                    try {
                        let participants: string[] = [];
                        if (typeof meeting.participants === 'string') {
                            participants = JSON.parse(meeting.participants);
                        } else if (Array.isArray(meeting.participants)) {
                            participants = meeting.participants;
                        }

                        if (currentUser?.email && participants.length > 0 && participants[0] === currentUser.email) {
                            setIsOrganizer(true);
                        }
                    } catch (e) {
                        console.error("Error parsing participants", e);
                    }

                    // Auto-join if flagged
                    if (location.state && (location.state as any).autoJoin) {
                        setStep('meeting');
                    }
                })
                .catch(error => {
                    console.error('Failed to load scheduled meeting:', error);
                    setLoadingStatus(prev => ({ ...prev, meeting: 'error' }));
                });
        } else {
            // Instant Meeting (no ID in URL)
            setLoadingStatus(prev => ({ ...prev, meeting: 'success' }));
            setIsOrganizer(true); // Creator of instant meeting is organizer
        }
    }, [scheduledMeetingId, navigate, currentUser, location]);


    // Auto-start meeting when looking ready (skip setup if desired, but kept for UX)
    // useEffect(() => {
    //     if (scheduledMeetingId && title && step === 'setup') {
    //          // Optional: Auto-join
    //     }
    // }, [scheduledMeetingId, title, step]);


    const startMeeting = async () => {
        // CRITICAL FIX: If joining an existing meeting, DO NOT create a new one.
        // Just switch to the meeting view using the current ID.
        if (scheduledMeetingId) {
            setStep('meeting');
            return;
        }

        setLoadingStatus({ meeting: 'pending' });

        try {
            // Include invites if any
            const participants = selectedUsers.map(u => u.email);
            if (currentUser?.email) participants.push(currentUser.email);

            const now = new Date();

            // Create meeting record for history/tracking even if solo instant meeting
            const newMeeting = await meetingService.createMeeting({
                title: title || t('meetings.liveInstantMeetingTitle'),
                date: now.toISOString(),
                participants: participants,
            });

            // Redirect to the new OFFICIAL meeting room with AUTO-JOIN
            if (newMeeting && newMeeting.id) {
                navigate(`/meet/${newMeeting.id}`, { state: { autoJoin: true } });
                return;
            }
        } catch (err) {
            console.error("Failed to create meeting record, using local fallback", err);
            // Fallback: Continue to local view if backend creation fails
        }

        // If we reach here, we either had an error or no ID returned.
        // We just show the Jitsi component locally as fallback.
        setLoadingStatus({ meeting: 'success' });
        setStep('meeting');
    };

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Check if audio track exists
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                const proceed = confirm(t('meetings.liveNoAudioTrack'));

                if (!proceed) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
            }

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                const blob = new Blob(chunksRef.current, { type: 'video/webm' });

                // Download the recording locally
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert(t('meetings.liveRecordingDownloaded'));
                setIsRecording(false);
            };

            recorder.start();
            setIsRecording(true);

            // Handle user clicking "Stop Sharing" native browser button
            stream.getVideoTracks()[0].onended = () => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            };

        } catch (err) {
            console.error("Error starting record", err);
            alert(t('meetings.liveRecordingError'));
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleEndMeeting = async () => {
        if (!scheduledMeetingId) return;

        if (confirm(t('meetings.liveEndMeetingConfirm'))) {
            try {
                navigate('/meetings');
            } catch (err) {
                console.error("Failed to end meeting", err);
            }
        }
    };

    const handleJitsiIFrameRef = (iframeRef: HTMLDivElement) => {
        iframeRef.style.height = '100%';
        iframeRef.style.width = '100%';
        iframeRef.style.background = 'transparent';
    };

    const handleApiReady = (apiObj: any) => {
        apiObj.on('videoConferenceLeft', () => {
            navigate('/meetings');
        });
        apiObj.on('readyToClose', () => {
            navigate('/meetings');
        });

        // Ensure default state matches lobby selection
        if (isMuted) apiObj.executeCommand('toggleAudio');
        if (isVideoOff) apiObj.executeCommand('toggleVideo');
    };

    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">{t('meetings.liveConnecting')}</p>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-[#0B0C15] text-slate-200 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px]" />
            </div>

            {/* Main Content Area */}
            <div className="relative flex-1 flex flex-col h-full z-10">

                {/* Header (Only visible in setup) */}
                {step === 'setup' && (
                    <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/meetings')}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-white tracking-tight">
                                    {title || t('meetings.liveNewMeeting')}
                                </h1>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <ShieldCheck className="w-3 h-3" />
                                        {t('meetings.liveSecure')}
                                    </span>
                                    {scheduledMeetingDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(scheduledMeetingDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Content */}
                <main className="flex-1 overflow-hidden relative p-4 md:p-6">
                    {step === 'setup' ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                                {/* 1. Preview Area */}
                                <div className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />

                                    {/* Mock Camera View */}
                                    <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-white/10 mb-6">
                                        {currentUser?.prenom?.[0]}{currentUser?.nom?.[0]}
                                    </div>

                                    <div>
                                        <p className="text-slate-400 text-sm font-medium mb-8">
                                            {t('meetings.liveCameraSimulated')}
                                        </p>

                                        {/* Quick Toggles */}
                                        <div className="relative z-10 flex gap-4">
                                        <button
                                            onClick={() => setIsMuted(!isMuted)}
                                            className={`p-4 rounded-2xl transition-all duration-300 ${isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/10'} border shadow-lg backdrop-blur-sm`}
                                        >
                                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                        </button>
                                        <button
                                            onClick={() => setIsVideoOff(!isVideoOff)}
                                            className={`p-4 rounded-2xl transition-all duration-300 ${isVideoOff ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/10'} border shadow-lg backdrop-blur-sm`}
                                        >
                                            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Join Options */}
                                <div className="space-y-8 pl-0 lg:pl-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">{t('meetings.liveReady')}</h2>
                                        <p className="text-slate-400 text-lg">
                                            {t('meetings.liveCheckAudioVideo', { title: <span className="text-blue-400 font-semibold">{title}</span> })}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Invitation Section for Instant Meeting */}
                                        {!scheduledMeetingId && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowInvite(!showInvite)}
                                                    className="w-full py-3 px-4 bg-secondary/30 hover:bg-secondary/50 border border-white/10 rounded-xl text-left flex items-center justify-between transition-colors mb-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="block font-medium text-sm text-slate-200">{t('meetings.liveInviteParticipants')}</span>
                                                            <span className="text-xs text-slate-400">
                                                                {selectedUsers.length > 0
                                                                    ? t('meetings.liveSelectedCount', { count: selectedUsers.length })
                                                                    : t('meetings.liveSelectFromDirectory')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Plus size={18} className={`text-slate-400 transition-transform ${showInvite ? 'rotate-45' : ''}`} />
                                                </button>

                                                {/* Invite Dropdown */}
                                                {showInvite && (
                                                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="p-2 border-b border-white/5">
                                                            <input
                                                                type="text"
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                placeholder={t('meetings.liveSearchName')}
                                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                                            {availableUsers
                                                                .filter(u =>
                                                                    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                    (u.nom && u.nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                                                    (u.prenom && u.prenom.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                )
                                                                .map(user => {
                                                                    const isSelected = selectedUsers.some(u => u.id === user.id);
                                                                    return (
                                                                        <button
                                                                            key={user.id}
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
                                                                                } else {
                                                                                    setSelectedUsers(prev => [...prev, user]);
                                                                                }
                                                                            }}
                                                                            className={`w-full flex items-center justify-between p-2 rounded-lg mb-1 text-left transition-colors ${isSelected ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}
                                                                        >
                                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                                                    {user.prenom?.[0]}{user.nom?.[0]}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-200' : 'text-slate-200'}`}>
                                                                                        {user.prenom} {user.nom}
                                                                                    </div>
                                                                                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                                                                </div>
                                                                            </div>
                                                                            {isSelected && <Check size={16} className="text-blue-400" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isBeforeScheduledTime ? (
                                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 flex items-start gap-3">
                                                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Réunion non commencée</p>
                                                    <p className="text-sm opacity-80 mt-1">
                                                        Le créateur n'a pas encore ouvert la salle. Actualisez la page à l'heure prévue.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={startMeeting}
                                                disabled={loadingStatus.meeting === 'pending'}
                                                className={`w-full py-4 px-6 bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground rounded-2xl font-semibold shadow-lg shadow-primary/25 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${loadingStatus.meeting === 'pending' ? 'opacity-70 cursor-wait' : ''}`}
                                            >
                                                {loadingStatus.meeting === 'pending' ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Création de la salle...
                                                    </>
                                                ) : (
                                                    <>
                                                        Rejoindre maintenant
                                                        <Layout className="w-5 h-5 opacity-70" />
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm pt-4">
                                            <ShieldCheck className="w-4 h-4" />
                                            Connexion chiffrée de bout en bout
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    ) : (
                        // MEETING VIEW (Jitsi)
                        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-slate-900 flex flex-col">
                            {/* Meeting Header with Info & Controls */}
                            <div className="bg-slate-800/80 border-b border-white/10 p-3 flex items-center justify-between backdrop-blur-sm z-10 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-xs text-blue-200 font-medium whitespace-nowrap">
                                            {t('meetings.liveRoomLabel')}<span className="font-mono ml-1 select-all">Tili-{scheduledMeetingId}</span>
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 hidden sm:inline-block leading-tight max-w-[200px]">{t('meetings.liveWaitingForHost')}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Recording Button */}
                                    {isOrganizer && (
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isRecording
                                                ? 'bg-red-500/20 border-red-500/50 text-red-200 animate-pulse'
                                                : 'bg-slate-700/50 border-white/10 text-slate-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            {isRecording ? (
                                                <StopCircle className="w-4 h-4" />
                                            ) : (
                                                <Disc className="w-4 h-4" />
                                            )}
                                            <span className="text-xs font-semibold">
                                                {isRecording
                                                    ? 'Stop Enregistrement'
                                                    : 'Enregistrer'
                                                }
                                            </span>
                                        </button>
                                    )}

                                    {isOrganizer && (
                                        <button
                                            onClick={handleEndMeeting}
                                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold py-2 px-4 rounded-lg border border-red-500/20 transition-all ml-4 shrink-0"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Terminer
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <JitsiMeeting
                                    domain="meet.element.io"
                                    // Use simple, consistent room name with hyphens to match URL ID
                                    roomName={`Tili-${scheduledMeetingId || 'Instant'}`}
                                    configOverwrite={{
                                        startWithAudioMuted: isMuted,
                                        startWithVideoMuted: isVideoOff,
                                        // Disable prejoin page / lobby from Jitsi side
                                        prejoinPageEnabled: false,
                                        enableLobby: false,
                                        // Also try these legacy or specific flags
                                        enableWelcomePage: false,
                                        enableClosePage: false,
                                        disableDeepLinking: true,
                                        disableThirdPartyRequests: true,
                                        // Hide some UI elements
                                        toolbarButtons: [
                                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                                            'tileview', 'select-background', 'download', 'help', 'mute-everyone',
                                            'security'
                                        ],
                                    }}
                                    interfaceConfigOverwrite={{
                                        SHOW_JITSI_WATERMARK: false,
                                        SHOW_WATERMARK_FOR_GUESTS: false,
                                        SHOW_BRAND_WATERMARK: false,
                                        brandString: 'Tili',
                                        DEFAULT_BACKGROUND: '#0B0C15',
                                        DEFAULT_LOCAL_DISPLAY_NAME: 'Moi',
                                        TOOLBAR_ALWAYS_VISIBLE: true,
                                    }}
                                    userInfo={{
                                        displayName: currentUser?.nom ? `${currentUser.prenom} ${currentUser.nom}` : (currentUser?.email || 'Invité'),
                                        email: currentUser?.email || ''
                                    }}
                                    onApiReady={(externalApi) => handleApiReady(externalApi)}
                                    getIFrameRef={(iframeRef) => handleJitsiIFrameRef(iframeRef)}
                                    spinner={LoadingSpinner}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
