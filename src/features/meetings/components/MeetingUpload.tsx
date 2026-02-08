
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileAudio, Users, Calendar, X } from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { userService } from '../../users/userService';
import { useAuthStore } from '../../auth/useAuthStore';
import type { User } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MeetingUploadProps {
    onUploadComplete: () => void;
}

export const MeetingUpload: React.FC<MeetingUploadProps> = ({ onUploadComplete }) => {
    const { user: currentUser } = useAuthStore();
    const { t } = useTranslation('common');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [participantSearch, setParticipantSearch] = useState('');
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const participantInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        userService.getAll().then(users => {
            setAvailableUsers(users.filter(u => u.isActive));
        }).catch(console.error);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (participantInputRef.current && !participantInputRef.current.parentElement?.contains(e.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredUsers = availableUsers.filter(u => {
        if (u.email === currentUser?.email) return false;
        if (selectedParticipants.includes(u.email)) return false;
        if (!participantSearch) return true;
        const s = participantSearch.toLowerCase();
        return u.email.toLowerCase().includes(s) || u.nom.toLowerCase().includes(s) || u.prenom.toLowerCase().includes(s);
    });

    const addParticipant = (email: string) => {
        if (!selectedParticipants.includes(email)) {
            setSelectedParticipants(prev => [...prev, email]);
        }
        setParticipantSearch('');
        setShowUserDropdown(false);
    };

    const removeParticipant = (email: string) => {
        setSelectedParticipants(prev => prev.filter(e => e !== email));
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.m4a'],
            'video/*': ['.mp4']
        },
        maxFiles: 1,
        multiple: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            const meeting = await meetingService.createMeeting({
                title: title || t('meetings.newMeetingTitle'),
                date,
                participants: [...selectedParticipants]
            });

            if (file) {
                try {
                    await meetingService.uploadAudio(meeting.id, file, false, (p: number) => setProgress(p));
                } catch (uploadError: any) {
                    console.error('Upload error:', uploadError);
                    const errorMsg = uploadError?.response?.data?.error?.message || uploadError?.message || t('meetings.unknownError');
                    if (errorMsg.includes('no audio track')) {
                        toast.warning(t('meetings.noAudioTrack'));
                    } else {
                        toast.error(t('meetings.uploadErrorWithMsg', { error: errorMsg }));
                    }
                }
            }

            toast.success(t('meetings.createSuccess'));
            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error(error);
            toast.error(t('meetings.createError'));
        } finally {
            setUploading(false);
            setProgress(0);
            setTitle('');
            setFile(null);
            setSelectedParticipants([]);
        }
    };

    return (
        <section
            className="bg-card rounded-2xl shadow-sm border border-border/80 p-6"
            aria-labelledby="upload-heading"
        >
            <h2 id="upload-heading" className="text-lg font-semibold text-foreground mb-5">
                {t('meetings.uploadTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5" aria-label={t('meetings.uploadFormAria')}>
                {/* Titre */}
                <div>
                    <label htmlFor="upload-title" className="block text-sm font-medium text-foreground mb-1.5">
                        {t('meetings.titleLabel')}
                    </label>
                    <input
                        id="upload-title"
                        type="text"
                        required
                        className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t('meetings.titlePlaceholder')}
                    />
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="upload-date" className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {t('meetings.dateLabel')}
                    </label>
                    <input
                        id="upload-date"
                        type="date"
                        required
                        className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>

                {/* Participants */}
                <div>
                    <label htmlFor="upload-participants" className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {t('meetings.participantsLabel')}
                    </label>
                    <div className="relative">
                        <input
                            id="upload-participants"
                            ref={participantInputRef}
                            type="text"
                            value={participantSearch}
                            onChange={(e) => { setParticipantSearch(e.target.value); setShowUserDropdown(true); }}
                            onFocus={() => setShowUserDropdown(true)}
                            placeholder={t('meetings.participantsSearch')}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                            autoComplete="off"
                            role="combobox"
                            aria-expanded={showUserDropdown && filteredUsers.length > 0}
                            aria-autocomplete="list"
                        />
                        {showUserDropdown && filteredUsers.length > 0 && (
                            <ul
                                role="listbox"
                                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto"
                            >
                                {filteredUsers.map(u => (
                                    <li key={u.id} role="option" aria-selected={false}>
                                        <button
                                            type="button"
                                            onClick={() => addParticipant(u.email)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                                        >
                                            <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-xs">
                                                {u.prenom.charAt(0)}{u.nom.charAt(0)}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-foreground truncate">{u.prenom} {u.nom}</span>
                                                <span className="block text-xs text-muted-foreground truncate">{u.email}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {selectedParticipants.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label={t('meetings.selectedParticipants')}>
                            {selectedParticipants.map(email => {
                                const u = availableUsers.find(u => u.email === email);
                                return (
                                    <span key={email} role="listitem" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                                        {u ? `${u.prenom} ${u.nom}` : email}
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(email)}
                                            className="hover:text-destructive transition-colors"
                                            aria-label={t('meetings.removeParticipant', { name: u ? `${u.prenom} ${u.nom}` : email })}
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Dropzone */}
                <div>
                    <span className="block text-sm font-medium text-foreground mb-1.5">{t('meetings.recordingOptional')}</span>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                            isDragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                        }`}
                        role="button"
                        aria-label={t('meetings.dropzoneAria')}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <FileAudio className="w-5 h-5" />
                                <span className="font-medium text-sm">{file.name}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Upload className="w-6 h-6" />
                                <p className="text-sm">{t('meetings.dropzoneHint')}</p>
                                <p className="text-xs opacity-70">{t('meetings.dropzoneFormats')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress */}
                {uploading && (
                    <div className="space-y-1.5" role="status" aria-live="polite">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{file ? t('meetings.uploading') : t('meetings.creating')}</span>
                            <span>{Math.round(progress)} %</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                                role="progressbar"
                                aria-valuenow={Math.round(progress)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {uploading ? t('meetings.processing') : (file ? t('meetings.createAndUpload') : t('meetings.createMeeting'))}
                </button>
            </form>
        </section>
    );
};
