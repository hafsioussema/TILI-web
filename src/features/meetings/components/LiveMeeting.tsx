

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Users, CircleDot,
    Loader2, Layout, Clock, Calendar, MessageSquare, Send, X,
    Monitor, MonitorOff
} from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { userService } from '../../users/userService';
import { useAuthStore } from '../../auth/useAuthStore';
import type { User } from '@/types';

const ParticipantVideo = ({
    stream,
    name,
    isLocal = false,
    isVideoOff = false,
    isMuted = false,
    isScreenSharing = false
}: {
    stream: MediaStream | null,
    name: string,
    isLocal?: boolean,
    isVideoOff?: boolean,
    isMuted?: boolean,
    isScreenSharing?: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Show placeholder if camera is off or stream is null
    const effectiveVideoOff = isVideoOff && !isScreenSharing;
    const showPlaceholder = effectiveVideoOff || !stream;

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-xl group transition-all duration-300 hover:border-blue-500/30">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''} ${showPlaceholder ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            />

            {/* Avatar Placeholder */}
            {showPlaceholder && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 animate-in fade-in duration-500 z-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border-4 border-white/10 mb-4">
                        {getInitials(name)}
                    </div>
                    <div className="text-slate-400 font-medium text-sm px-4 py-1.5 bg-black/30 rounded-full backdrop-blur-sm">
                        {isScreenSharing ? 'Initialisation du partage...' : (effectiveVideoOff ? 'Caméra désactivée' : 'Chargement...')}
                    </div>
                </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 z-10 transition-transform duration-300 group-hover:scale-105">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                <span className="text-xs font-bold text-white tracking-tight">{name} {isLocal ? '(Moi)' : ''}</span>
                {isMuted && <MicOff className="w-3 h-3 text-red-500 ml-1" />}
                {isScreenSharing && <Monitor className="w-3 h-3 text-blue-400 ml-1" />}
            </div>

            {/* Status Icons Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {isVideoOff && (
                    <div className="p-2 bg-red-500/20 backdrop-blur-md rounded-lg border border-red-500/20 text-red-500">
                        <VideoOff className="w-4 h-4" />
                    </div>
                )}
                {isMuted && (
                    <div className="p-2 bg-red-500/20 backdrop-blur-md rounded-lg border border-red-500/20 text-red-500">
                        <MicOff className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    );
};

export const LiveMeeting = () => {
    const navigate = useNavigate();
    const { id: scheduledMeetingId } = useParams<{ id?: string }>();
    const [step, setStep] = useState<'setup' | 'meeting' | 'saving'>('setup');

    // Setup Form
    const [title, setTitle] = useState('');
    const [participants, setParticipants] = useState('');
    const [shouldRecord, setShouldRecord] = useState(true);
    const [minPresence, setMinPresence] = useState(15); // Default 15 mins
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [suggestions, setSuggestions] = useState<User[]>([]);

    // Meeting Type: 'instant' or 'scheduled'
    const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>('instant');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    // For scheduled meetings - track time and recording permissions
    const [scheduledMeetingDate, setScheduledMeetingDate] = useState<Date | null>(null);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [canRecord, setCanRecord] = useState(false);
    const [isBeforeScheduledTime, setIsBeforeScheduledTime] = useState(false);
    const [organizerEmail, setOrganizerEmail] = useState<string | null>(null);

    // Media State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: MediaStream }>({});
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnections = useRef<{ [socketId: string]: RTCPeerConnection }>({});

    // Recording State
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [duration, setDuration] = useState(0);

    // Real-time State
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'members'>('chat');
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Loading Status
    const [loadingStatus, setLoadingStatus] = useState({
        meeting: 'pending' as 'pending' | 'success' | 'error',
        camera: 'pending' as 'pending' | 'success' | 'error'
    });

    const { user: currentUser } = useAuthStore();

    // Load scheduled meeting data if joining via ID
    useEffect(() => {
        if (scheduledMeetingId) {
            meetingService.getMeeting(scheduledMeetingId)
                .then(meeting => {
                    setTitle(meeting.title);
                    setMeetingType('instant'); // Force instant when joining

                    // Parse and set participants
                    try {
                        const participantsList = meeting.participants ? JSON.parse(meeting.participants) : [];
                        setParticipants(participantsList.join(', '));
                    } catch {
                        setParticipants('');
                    }

                    // Store scheduled meeting date
                    const meetingDate = new Date(meeting.date);
                    setScheduledMeetingDate(meetingDate);
                    setLoadingStatus(prev => ({ ...prev, meeting: 'success' }));

                    // Check if current time is before scheduled time
                    const now = new Date();
                    setIsBeforeScheduledTime(now < meetingDate);


                    const participantsList = meeting.participants ? JSON.parse(meeting.participants) : [];
                    const firstParticipant = participantsList.length > 0 ? participantsList[0] : null;
                    setOrganizerEmail(firstParticipant);

                    const isCurrentUserOrganizer = firstParticipant === currentUser?.email;
                    setIsOrganizer(isCurrentUserOrganizer);

                    // Can only record if:
                    // 1. User is organizer AND
                    // 2. Current time >= scheduled time
                    setCanRecord(isCurrentUserOrganizer && now >= meetingDate);
                })
                .catch(error => {
                    console.error('Failed to load scheduled meeting:', error);
                    setLoadingStatus(prev => ({ ...prev, meeting: 'error' }));
                    // alert('Impossible de charger la réunion planifiée.');
                    // navigate('/meetings');
                });
        }
    }, [scheduledMeetingId, navigate, currentUser]);


    // Auto-start meeting when joining a scheduled meeting
    useEffect(() => {
        if (scheduledMeetingId && title && stream && step === 'setup') {
            // Immediately start the meeting (skip setup form)
            startMeeting();
        }
    }, [scheduledMeetingId, title, stream, step]);


    // Load Users for Autocomplete
    useEffect(() => {
        userService.getAll().then(users => {
            // Filter out the current user from the list
            if (currentUser?.email) {
                setAllUsers(users.filter(u => u.email !== currentUser.email));
            } else {
                setAllUsers(users);
            }
        }).catch(console.error);
    }, [currentUser]);

    // Initialize Camera on Mount
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    // Socket.io initialization and listeners
    useEffect(() => {
        if (step === 'meeting' && scheduledMeetingId && currentUser) {
            // Disconnect existing socket if any
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            // Connect to server
            // Using window.location.hostname to connect to the backend on port 3000
            const socket = io('http://localhost:3000');
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('Connected to socket server');
                socket.emit('joinMeeting', {
                    meetingId: scheduledMeetingId,
                    user: {
                        name: currentUser.nom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser.email,
                        email: currentUser.email
                    }
                });
            });

            socket.on('messageReceived', (message: any) => {
                setMessages(prev => [...prev, message]);
            });

            socket.on('participantsUpdated', async (participants: any[]) => {
                setActiveParticipants(participants);
                console.log('Participants updated:', participants.length);

                // For each participant that we don't have a peer connection with, create one
                for (const p of participants) {
                    if (p.socketId !== socket.id && !peerConnections.current[p.socketId]) {
                        // To avoid both peers calling each other at the same time (glare),
                        // only the peer with the lexicographically smaller socket ID initiates
                        if (socket.id! < p.socketId) {
                            console.log(`[Meeting] Initiating call to ${p.socketId}`);
                            const pc = createPeerConnection(p.socketId);
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            socket.emit('callUser', {
                                offer,
                                to: p.socketId,
                                from: socket.id,
                                name: currentUser.nom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser.email
                            });
                        }
                    }
                }

                // Clean up old connections
                const currentSocketIds = participants.map(p => p.socketId);
                Object.keys(peerConnections.current).forEach(id => {
                    if (!currentSocketIds.includes(id)) {
                        peerConnections.current[id].close();
                        delete peerConnections.current[id];
                        setRemoteStreams(prev => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                        });
                    }
                });
            });

            socket.on('callMade', async (data: any) => {
                const pc = createPeerConnection(data.socket);
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('makeAnswer', {
                    answer,
                    to: data.socket
                });
            });

            socket.on('answerMade', async (data: any) => {
                const pc = peerConnections.current[data.socket];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
            });

            socket.on('iceCandidateReceived', async (data: any) => {
                const pc = peerConnections.current[data.socket];
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.error('Error adding ice candidate', e);
                    }
                }
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.emit('leaveMeeting', { meetingId: scheduledMeetingId });
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        }
    }, [step, scheduledMeetingId, currentUser]);

    // Scroll to bottom of chat when messages change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showSidebar, sidebarTab]);

    const sendMessage = () => {
        if (!newMessage.trim() || !socketRef.current || !scheduledMeetingId || !currentUser) return;

        const messageData = {
            sender: currentUser.email,
            senderName: currentUser.nom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser.email,
            text: newMessage,
            timestamp: new Date().toISOString(),
            meetingId: scheduledMeetingId
        };

        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
    };

    // Sync Stream to Video Element (Crucial when switching steps/views)
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, step]);

    // Timer
    useEffect(() => {
        let interval: any;
        if (step === 'meeting') {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const startCamera = async () => {
        setLoadingStatus(prev => ({ ...prev, camera: 'pending' }));
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setLoadingStatus(prev => ({ ...prev, camera: 'success' }));
        } catch (err) {
            console.error("Error accessing media devices:", err);
            setLoadingStatus(prev => ({ ...prev, camera: 'error' }));
        }
    };

    const stopCamera = () => {
        // We use the functional state update or standard ref checking to ensure we clean up correctly
        // But since stream is state, we need to be careful. 
        // For simple cleanup on unmount:
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const toggleMute = () => {
        if (stream) {
            const enabled = stream.getAudioTracks()[0].enabled;
            stream.getAudioTracks().forEach(track => track.enabled = !enabled);
            setIsMuted(enabled);
            socketRef.current?.emit('toggleMedia', { meetingId: scheduledMeetingId, audio: enabled });
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const enabled = stream.getVideoTracks()[0].enabled;
            stream.getVideoTracks().forEach(track => track.enabled = !enabled);
            setIsVideoOff(enabled);
            socketRef.current?.emit('toggleMedia', { meetingId: scheduledMeetingId, video: enabled });
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            handleStopScreenShare();
        } else {
            try {
                const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenStream(s);
                const screenTrack = s.getVideoTracks()[0];

                screenTrack.onended = () => {
                    // This is triggered if the user stops sharing via browser bar
                    // We need a stable cleanup logic
                    handleStopScreenShare();
                };

                // Replace video track with screen track on all peer connections
                Object.values(peerConnections.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                setIsScreenSharing(true);
                socketRef.current?.emit('toggleMedia', { meetingId: scheduledMeetingId, screen: true });
            } catch (err) {
                console.error("Error starting screen share:", err);
            }
        }
    };

    const handleStopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setIsScreenSharing(false);
        socketRef.current?.emit('toggleMedia', { meetingId: scheduledMeetingId, screen: false });

        const videoTrack = stream?.getVideoTracks()[0];
        if (videoTrack) {
            Object.values(peerConnections.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack);
            });
        }
    };

    const createPeerConnection = (socketId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('iceCandidate', {
                    candidate: event.candidate,
                    to: socketId
                });
            }
        };

        pc.ontrack = (event) => {
            // Ensure we have a stream, create one if event.streams is empty
            const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
            setRemoteStreams(prev => ({
                ...prev,
                [socketId]: remoteStream
            }));
        };

        if (stream) {
            stream.getTracks().forEach(track => {
                // If we are sharing screen, replace the camera video track with the screen track
                if (track.kind === 'video' && isScreenSharing && screenStream) {
                    const screenTrack = screenStream.getVideoTracks()[0];
                    if (screenTrack) {
                        pc.addTrack(screenTrack, screenStream);
                        return;
                    }
                }
                pc.addTrack(track, stream);
            });
        }

        peerConnections.current[socketId] = pc;
        return pc;
    };

    const startMeeting = async () => {
        // For scheduled meetings, create immediately and redirect
        if (meetingType === 'scheduled') {
            if (!scheduledDate || !scheduledTime) {
                alert('Veuillez sélectionner une date et une heure pour la réunion planifiée.');
                return;
            }

            setStep('saving');
            try {
                const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
                const participantList = participants.split(',').map(p => p.trim()).filter(p => p);

                await meetingService.createMeeting({
                    title: title || 'Untitled Meeting',
                    date: dateTimeString,
                    participants: participantList,
                    minPresenceDuration: minPresence,
                });

                // Stop camera for scheduled meetings
                stopCamera();

                // Redirect to meetings list or calendar
                navigate('/meetings');
            } catch (error) {
                console.error('Failed to schedule meeting:', error);
                alert('Échec de la planification de la réunion. Vérifiez la console.');
                setStep('setup');
            }
        }

        // For instant meetings OR scheduled meetings (when joining), start recording if allowed
        // Only record if:
        // - shouldRecord is true AND
        // - stream exists AND
        // - (it's an instant meeting OR user has permission to record)
        const canStartRecording = shouldRecord && stream && (!scheduledMeetingId || canRecord);

        if (canStartRecording) {
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
        }
        setStep('meeting');
    };

    const endMeeting = async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            // Wait a bit for the last chunk
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setStep('saving');
        await processAndSave();
    };

    const processAndSave = async () => {
        try {
            const participantsList = participants.split(',').map(p => p.trim()).filter(p => p);

            let meetingData;

            // If joining a scheduled meeting, update it instead of creating new
            if (scheduledMeetingId) {
                // Update the existing meeting with actual start time
                meetingData = await meetingService.getMeeting(scheduledMeetingId);
                // The meeting already exists, we just need to upload the recording
            } else {
                // Create new meeting metadata
                meetingData = await meetingService.createMeeting({
                    title: title || 'Untitled Meeting',
                    date: new Date().toISOString(),
                    participants: participantsList,
                    minPresenceDuration: minPresence * 60 // Convert to seconds
                });
            }

            // 2. If recorded, upload audio/video
            if (shouldRecord && chunksRef.current.length > 0) {
                // Use video/webm to ensure video track is preserved
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                // Convert to File
                const file = new File([blob], "recording.webm", { type: 'video/webm' });
                await meetingService.uploadAudio(meetingData.id, file);
            }

            // Redirect to the meeting's detail page
            navigate(`/meetings/${meetingData.id}`);
        } catch (error) {
            console.error("Failed to save meeting", error);
            alert("Failed to save meeting data. Check console.");
            navigate('/meetings'); // Fallback
        }
    };

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- RENDER ---

    if (step === 'saving') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <h2 className="text-xl font-semibold">Saving Meeting...</h2>
                {shouldRecord && <p className="text-slate-400 mt-2">Uploading recording & starting transcription...</p>}
            </div>
        );
    }

    if (step === 'meeting') {
        return (
            <div className="h-screen bg-slate-950 relative overflow-hidden flex">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-shadow tracking-tight text-lg">{title || 'Sans titre'}</h1>
                                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                                    {shouldRecord && canRecord && (
                                        <span className="flex items-center gap-1.5 text-red-500 animate-pulse bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                            <CircleDot className="w-2.5 h-2.5 fill-red-500" /> REC
                                        </span>
                                    )}
                                    {shouldRecord && !canRecord && isBeforeScheduledTime && (
                                        <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                                            <Clock className="w-3 h-3" /> En attente
                                        </span>
                                    )}
                                    <span className="bg-white/10 px-2.5 py-0.5 rounded-md text-white font-mono border border-white/10 backdrop-blur-sm">
                                        {formatDuration(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right side buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setSidebarTab('members'); setShowSidebar(true); }}
                                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white transition-all backdrop-blur-md border border-white/10"
                            >
                                <Users className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => { setSidebarTab('chat'); setShowSidebar(true); }}
                                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white transition-all backdrop-blur-md border border-white/10"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Warning Banner */}
                    {isBeforeScheduledTime && scheduledMeetingDate && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 max-w-xl w-full px-4">
                            <div className="bg-yellow-500/90 backdrop-blur-md text-yellow-950 px-6 py-4 rounded-2xl shadow-2xl border border-yellow-400/50 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                    ⏰
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-lg leading-tight">Salle d'Attente</div>
                                    <div className="text-sm font-medium opacity-90">
                                        Réunion à {scheduledMeetingDate instanceof Date && !isNaN(scheduledMeetingDate.getTime()) ? scheduledMeetingDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '...'} .
                                        {isOrganizer ? " L'enregistrement démarrera automatiquement." : " Testez votre matériel en attendant."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Video Area: Dynamic Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 flex items-center justify-center">
                        <div className={`grid gap-4 w-full h-full max-w-7xl mx-auto
                            ${Object.keys(remoteStreams).length === 0 ? 'grid-cols-1' :
                                Object.keys(remoteStreams).length === 1 ? 'grid-cols-1 md:grid-cols-2' :
                                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
                        `}>
                            {/* Local Video */}
                            <ParticipantVideo
                                stream={isScreenSharing ? screenStream : stream}
                                name={currentUser?.prenom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser?.email || 'Moi'}
                                isLocal={true}
                                isVideoOff={isVideoOff}
                                isMuted={isMuted}
                                isScreenSharing={isScreenSharing}
                            />

                            {/* Remote Videos */}
                            {Object.entries(remoteStreams).map(([socketId, remoteStream]) => {
                                const participant = activeParticipants.find(p => p.socketId === socketId);
                                return (
                                    <ParticipantVideo
                                        key={socketId}
                                        stream={remoteStream}
                                        name={participant?.name || 'Participant'}
                                        isVideoOff={participant?.isVideoOff}
                                        isMuted={participant?.isMuted}
                                        isScreenSharing={participant?.isScreenSharing}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="h-24 flex items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 z-20">
                        <button
                            onClick={toggleMute}
                            title={isMuted ? "Réactiver le micro" : "Couper le micro"}
                            className={`p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ${isMuted ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            title={isVideoOff ? "Activer la caméra" : "Couper la caméra"}
                            className={`p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ${isVideoOff ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                        </button>

                        <button
                            onClick={toggleScreenShare}
                            title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
                            className={`p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            {isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
                        </button>

                        <div className="mx-4 h-8 w-[1px] bg-white/10"></div>

                        <button
                            onClick={endMeeting}
                            className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95"
                        >
                            <PhoneOff className="w-5 h-5 fill-white" />
                            <span className="hidden sm:inline">Quitter la séance</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar: Chat & Participants */}
                {showSidebar && (
                    <div className="w-96 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300">
                        {/* Tabs Header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex p-1 bg-black/40 rounded-xl">
                                <button
                                    onClick={() => setSidebarTab('chat')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${sidebarTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Discussion
                                </button>
                                <button
                                    onClick={() => setSidebarTab('members')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${sidebarTab === 'members' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Membres {activeParticipants.length > 0 && `(${activeParticipants.length})`}
                                </button>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Content: Chat */}
                        {sidebarTab === 'chat' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                                            <div className="p-4 bg-slate-800 rounded-full">
                                                <MessageSquare className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">Bievenue dans le chat !</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.sender === 'system' ? 'items-center py-2' : msg.sender === currentUser?.email ? 'items-end' : 'items-start'}`}>
                                            {msg.sender === 'system' ? (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                                                    {msg.text}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-[11px] font-bold text-slate-500 mb-1 ml-1 mr-1">
                                                        {msg.sender === currentUser?.email ? 'Moi' : msg.senderName}
                                                    </span>
                                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-md ${msg.sender === currentUser?.email ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'}`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[9px] text-slate-600 mt-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 border-t border-white/5 bg-black/20">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Tapez votre message..."
                                            className="w-full bg-slate-800 border border-white/10 text-white rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tab Content: Members */}
                        {sidebarTab === 'members' && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">Participants Actuels</h3>
                                {activeParticipants.map((participant, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                            {participant.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                                                {participant.name}
                                                {participant.email === currentUser?.email && (
                                                    <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">VOUS</span>
                                                )}
                                                {participant.email === organizerEmail && (
                                                    <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">ORGA</span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 truncate">{participant.email}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                                {activeParticipants.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">
                                        Chargement de la liste...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // SETUP STEP
    // If we have a scheduled ID but we are still loading, show a loader
    if (scheduledMeetingId && step === 'setup' && (loadingStatus.meeting === 'pending' || (loadingStatus.camera === 'pending' && !stream))) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 tracking-tight">Préparation de la réunion</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium">
                    Nous configurons votre environnement sécurisé et vérifions vos périphériques.
                </p>

                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Layout className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-semibold">Détails de la session</span>
                        </div>
                        {loadingStatus.meeting === 'pending' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Video className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-semibold">Caméra & Micro</span>
                        </div>
                        {loadingStatus.camera === 'pending' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>}
                    </div>
                </div>

                {loadingStatus.meeting === 'error' && (
                    <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm max-w-sm">
                        Erreur lors du chargement de la réunion.
                        <button onClick={() => window.location.reload()} className="ml-2 font-bold underline hover:text-red-300">Réessayer</button>
                    </div>
                )}
            </div>
        );
    }

    // If camera failed but meeting loaded, we can still proceed
    if (scheduledMeetingId && step === 'setup' && loadingStatus.meeting === 'success' && loadingStatus.camera === 'error') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 border border-yellow-500/20">
                    <VideoOff className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Accès caméra refusé</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
                    Vous pouvez rejoindre la réunion sans caméra, mais vous ne pourrez pas être vu par les autres participants.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
                    >
                        Réessayer
                    </button>
                    <button
                        onClick={() => startMeeting()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        Continuer sans caméra
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            {/* Left: Preview */}
            <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center justify-center relative">
                <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-slate-700">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <div className="text-slate-500">Camera is off</div>
                        </div>
                    )}

                    {/* Preview Controls overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button
                            onClick={toggleMute}
                            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-slate-800/80 hover:bg-slate-700'} text-white backdrop-blur`}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-slate-800/80 hover:bg-slate-700'} text-white backdrop-blur`}
                        >
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <p className="text-slate-400 mt-6 text-sm">Check your hair and audio before joining...</p>
            </div>

            {/* Right: Settings */}
            <div className="w-full lg:w-[450px] bg-white p-8 lg:p-12 flex flex-col justify-center shadow-xl z-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Ready to join?</h1>
                    <p className="text-slate-500">Setup your meeting details below</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Weekly Design Sync"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Meeting Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Type de réunion</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMeetingType('instant')}
                                className={`p-4 rounded-xl border-2 transition-all ${meetingType === 'instant'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-1">⚡</div>
                                    <div className="font-semibold text-sm">Instantanée</div>
                                    <div className="text-xs opacity-75 mt-1">Maintenant</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMeetingType('scheduled')}
                                className={`p-4 rounded-xl border-2 transition-all ${meetingType === 'scheduled'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-1">📅</div>
                                    <div className="font-semibold text-sm">Planifiée</div>
                                    <div className="text-xs opacity-75 mt-1">Future</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Date/Time Selection for Scheduled Meetings */}
                    {meetingType === 'scheduled' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-2">📅 Date</label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-2">🕐 Heure</label>
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={e => setScheduledTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Participants</label>
                        <input
                            type="text"
                            value={participants}
                            onChange={e => {
                                const val = e.target.value;
                                setParticipants(val);

                                const lastPart = val.split(',').pop()?.trim().toLowerCase();
                                if (lastPart && lastPart.length > 0) {
                                    const filtered = allUsers.filter(u =>
                                        (u.prenom?.toLowerCase().includes(lastPart) ||
                                            u.nom?.toLowerCase().includes(lastPart) ||
                                            u.email.toLowerCase().includes(lastPart)) &&
                                        u.email !== currentUser?.email // Extra safety
                                    );
                                    setSuggestions(filtered);
                                } else {
                                    setSuggestions([]);
                                }
                            }}
                            placeholder="alice@example.com, bob@example.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {suggestions.map(user => (
                                    <div
                                        key={user.id}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                                        onClick={() => {
                                            const parts = participants.split(',');
                                            parts.pop(); // Remove partial
                                            parts.push(user.email);
                                            setParticipants(parts.join(', ') + ', '); // Add email + comma and space
                                            setSuggestions([]);
                                        }}
                                    >
                                        <span className="font-medium text-slate-800">{user.prenom} {user.nom}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <div className="mt-0.5">
                            <CircleDot className={`w-5 h-5 ${shouldRecord ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-800">Record Meeting</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={shouldRecord} onChange={e => setShouldRecord(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <p className="text-xs text-slate-500">
                                {shouldRecord
                                    ? "Audio will be analyzed by AI for summary & actions."
                                    : "No recording will be saved. Manual notes only."}
                            </p>
                        </div>
                    </div>

                    {/* Minimum Presence Slider */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <label className="text-sm font-medium text-slate-700">Attendance Threshold</label>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500">How long must a guest stay to be "Present"?</span>
                            <span className="text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{minPresence} min</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={minPresence}
                            onChange={(e) => setMinPresence(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>5m</span>
                            <span>30m</span>
                            <span>60m</span>
                        </div>
                    </div>

                    <button
                        onClick={startMeeting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {meetingType === 'scheduled' ? (
                            <>
                                <Calendar className="w-5 h-5" />
                                Planifier la Réunion
                            </>
                        ) : (
                            <>
                                <Layout className="w-5 h-5" />
                                Start Meeting Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
