
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { documentService } from '../../documents/documentService';
import { userService } from '../../users/userService';
import type { Meeting } from '../types';
import type { TiliDocument } from '@/types/documents';
import { DocumentType } from '@/types/documents';
import { useAuthStore } from '../../auth/useAuthStore';
import { Loader2, ArrowLeft, Calendar, Clock, FileText, CheckSquare, ListVideo, AlertCircle, Trash2, Users, Pencil, Plus, X, Check, Paperclip, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown'; // Assuming standard markdown renderer or just plain text
import { useTranslation } from 'react-i18next';

// Simple Markdown renderer fallback if package not present (though likely is or I should install)
// I will assume simple rendering for now or basic text to be safe in hackathon mode without verifying package.json deeply again.
// Actually, `react-markdown` is common. I'll check package.json after this tool call to be sure.
// If not installed, I'll fallback to `white-space: pre-wrap`.

export const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuthStore();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions' | 'documents'>('summary');
    const [showReportModal, setShowReportModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Documents State
    const [meetingDocuments, setMeetingDocuments] = useState<TiliDocument[]>([]);
    const [allDocuments, setAllDocuments] = useState<TiliDocument[]>([]);
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(false);
    
    // Upload new document state
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.CR_REUNION);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editParticipants, setEditParticipants] = useState<string[]>([]);
    const [newParticipantEmail, setNewParticipantEmail] = useState('');
    const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string; prenom: string; nom: string }[]>([]);
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { t } = useTranslation('common');

    useEffect(() => {
        userService.getAll().then(users => setAvailableUsers(users.filter(u => u.isActive))).catch(() => {});
    }, []);

    useEffect(() => {
        if (id) {
            loadMeeting(id);
            // Poll every 5 seconds if processing
            const interval = setInterval(() => {
                if (error) return;
                meetingService.getMeeting(id).then(data => {
                    if (data.status !== 'PROCESSING') {
                        // If it was processing and now it's done, show report
                        if (meeting?.status === 'PROCESSING' && data.status === 'COMPLETED') {
                            setShowReportModal(true);
                        }
                        setMeeting(data);
                    } else if (meeting?.status === 'PROCESSING') {
                        loadMeeting(id);
                    }
                }).catch(() => { });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [id, meeting?.status, error]);

    // Also check if we just arrived here from creation
    useEffect(() => {
        if (meeting?.status === 'COMPLETED' && !sessionStorage.getItem(`viewed_report_${meeting.id}`)) {
            setShowReportModal(true);
            sessionStorage.setItem(`viewed_report_${meeting.id}`, 'true');
        }
    }, [meeting?.status]);

    const loadMeeting = async (meetingId: string) => {
        try {
            const data = await meetingService.getMeeting(meetingId);
            setMeeting(data);
            setError(null);

            // Load meeting documents
            loadMeetingDocuments(meetingId);

            // Pre-fill edit states
            setEditTitle(data.title);
            const d = new Date(data.date);
            setEditDate(d.toISOString().split('T')[0]);
            setEditTime(d.toTimeString().split(' ')[0].substring(0, 5));
            try {
                setEditParticipants(data.participants ? JSON.parse(data.participants) : []);
            } catch {
                setEditParticipants([]);
            }
        } catch (e: any) {
            console.error(e);
            if (e.response?.status === 403) {
                setError(t('meetings.detail.accessDenied'));
            } else if (e.response?.status === 404) {
                setError(t('meetings.detail.notFound'));
            } else {
                setError(t('meetings.detail.loadError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMeetingDocuments = async (meetingId: string) => {
        setLoadingDocs(true);
        try {
            const docIds = await meetingService.getDocuments(meetingId);
            if (docIds.length > 0) {
                // Fetch document details for each ID
                const docs = await Promise.all(
                    docIds.map(async (docId) => {
                        try {
                            return await documentService.getById(docId);
                        } catch {
                            return null;
                        }
                    })
                );
                setMeetingDocuments(docs.filter((d): d is TiliDocument => d !== null));
            } else {
                setMeetingDocuments([]);
            }
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const loadAllDocuments = async () => {
        try {
            const docs = await documentService.getAll();
            setAllDocuments(docs);
        } catch (err) {
            console.error('Failed to load all documents:', err);
        }
    };

    const handleAddDocument = async (documentId: string) => {
        if (!meeting) return;
        try {
            await meetingService.addDocument(meeting.id, documentId);
            loadMeetingDocuments(meeting.id);
            setShowAddDocModal(false);
        } catch (err) {
            console.error('Failed to add document:', err);
            alert(t('meetings.detail.addDocError'));
        }
    };

    const handleRemoveDocument = async (documentId: string) => {
        if (!meeting) return;
        if (!confirm(t('meetings.detail.removeDocConfirm'))) return;
        try {
            await meetingService.removeDocument(meeting.id, documentId);
            loadMeetingDocuments(meeting.id);
        } catch (err) {
            console.error('Failed to remove document:', err);
            alert(t('meetings.detail.removeDocError'));
        }
    };

    const handleDownloadDocument = async (doc: TiliDocument) => {
        try {
            await documentService.download(doc._id, doc.name);
        } catch (err) {
            console.error('Failed to download document:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            if (!uploadName) {
                setUploadName(file.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    const handleUploadNewDocument = async () => {
        if (!uploadFile || !uploadName || !meeting) {
            toast.error(t('meetings.detail.uploadMissingFields'));
            return;
        }

        setUploadingDoc(true);
        try {
            const newDoc = await documentService.upload(uploadFile, {
                name: uploadName,
                type: uploadType,
                projectId: '',
                description: t('meetings.detail.uploadDocDesc', { title: meeting.title }),
            });
            
            // Associate to meeting
            await meetingService.addDocument(meeting.id, newDoc._id);
            
            // Reload documents
            loadMeetingDocuments(meeting.id);
            
            // Reset upload form
            setUploadFile(null);
            setUploadName('');
            setUploadType(DocumentType.CR_REUNION);
            setShowUploadForm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            toast.success(t('meetings.detail.uploadSuccess'));
        } catch (error) {
            console.error('Failed to upload document:', error);
            toast.error(t('meetings.detail.uploadError'));
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!meeting) return;
        setIsSaving(true);
        try {
            const dateTimeString = `${editDate}T${editTime}:00`;
            await meetingService.updateMeeting(meeting.id, {
                title: editTitle,
                date: dateTimeString,
                participants: editParticipants,
            });
            setShowEditModal(false);
            loadMeeting(meeting.id);
            alert(t('meetings.detail.editSuccess'));
        } catch (err) {
            console.error('Failed to update meeting:', err);
            alert(t('meetings.detail.editError'));
        } finally {
            setIsSaving(false);
        }
    };

    const addParticipant = () => {
        if (newParticipantEmail && !editParticipants.includes(newParticipantEmail)) {
            if (!newParticipantEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                alert(t('meetings.detail.invalidEmail'));
                return;
            }
            setEditParticipants([...editParticipants, newParticipantEmail]);
            setNewParticipantEmail('');
        }
    };

    const removeParticipant = (email: string) => {
        // Organizer cannot be removed (assuming first is organizer)
        if (editParticipants.indexOf(email) === 0) {
            alert(t('meetings.detail.organizerCannotBeRemoved'));
            return;
        }
        setEditParticipants(editParticipants.filter(p => p !== email));
    };

    const handleFinalizeWithoutAudio = async () => {
        if (!meeting) return;
        if (!confirm(t('meetings.detail.finalizeWithoutAudioConfirm'))) {
            return;
        }
        try {
            toast.info(t('meetings.detail.finalizing'));
            await meetingService.finalizeWithoutAudio(meeting.id);
            toast.success(t('meetings.detail.finalizeSuccess'));
            loadMeeting(meeting.id);
        } catch (error) {
            console.error('Failed to finalize meeting:', error);
            toast.error(t('meetings.detail.finalizeError'));
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    if (error) return (
        <div className="max-w-xl mx-auto py-12 text-center px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('meetings.detail.accessRestrictedTitle')}</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/meetings" className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {t('meetings.detail.backToDashboard')}
            </Link>
        </div>
    );

    if (!meeting) return <div className="text-center py-12 text-muted-foreground">{t('meetings.detail.notFound')}</div>;

    if (meeting.status === 'FAILED') {
        return (
            <div className="max-w-5xl mx-auto py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t('meetings.detail.processingFailedTitle')}</h2>
                <p className="text-muted-foreground mb-6">{t('meetings.detail.processingFailedDesc')}</p>
                <Link to="/meetings" className="text-primary hover:underline">{t('meetings.detail.backToMeetings')}</Link>
            </div>
        );
    }

    // Special view for SCHEDULED meetings (not yet started)
    if (meeting.status === 'SCHEDULED') {
        const meetingDate = new Date(meeting.date);
        const now = new Date();
        const isPast = meetingDate < now;
        const isToday = meetingDate.toDateString() === now.toDateString();

        let participants: string[] = [];
        try {
            participants = meeting.participants ? JSON.parse(meeting.participants) : [];
        } catch {
            participants = [];
        }

        // Check if current user is the organizer (first participant)
        const isOrganizer = participants.length > 0 && participants[0] === currentUser?.email;

        return (
            <div className="max-w-4xl mx-auto pb-12">
                <Link to="/meetings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux réunions
                </Link>

                <div className="bg-card rounded-2xl shadow-sm border border-border/80 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary px-8 py-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-primary-foreground/20 backdrop-blur rounded-full text-xs font-semibold text-primary-foreground uppercase">
                                        Planifiée
                                    </span>
                                    {isPast && (
                                        <span className="px-3 py-1 bg-destructive/80 backdrop-blur rounded-full text-xs font-semibold text-primary-foreground uppercase">
                                            Passée
                                        </span>
                                    )}
                                    {isToday && !isPast && (
                                        <span className="px-3 py-1 bg-emerald-600/80 backdrop-blur rounded-full text-xs font-semibold text-primary-foreground uppercase animate-pulse">
                                            Aujourd’hui
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold text-primary-foreground mb-2">{meeting.title}</h1>
                                <div className="flex items-center gap-4 text-primary-foreground/90 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {meetingDate.toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {meetingDate.toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Participants */}
                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Participants Invités ({participants.length})
                            </h2>
                            <div className="bg-muted/50 rounded-xl border border-border divide-y divide-border">
                                {participants.length === 0 ? (
                                    <div className="p-4 text-muted-foreground text-center">Aucun participant invité</div>
                                ) : (
                                    participants.map((email, index) => (
                                        <div key={index} className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-primary font-semibold text-sm">
                                                    {email.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{email}</div>
                                                <div className="text-xs text-muted-foreground">{index === 0 ? 'Organisateur' : 'Invité'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground mb-2">
                                        {isPast ? "Cette réunion est passée" : "Réunion à venir"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {isPast ? (
                                            "Cette réunion était planifiée mais n'a pas encore été enregistrée. Vous pouvez la démarrer maintenant ou la supprimer."
                                        ) : (
                                            <>
                                                Tous les participants ont reçu une invitation par email.
                                                Un rappel sera envoyé automatiquement 1 heure avant le début.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            {(meeting.status as string) === 'COMPLETED' ? (
                                <div className="flex-1 bg-muted text-muted-foreground font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-border">
                                    <Check className="w-5 h-5" />
                                    Réunion terminée
                                </div>
                            ) : (
                                (!isPast || isToday) && (
                                    <Link
                                        to={`/meet/${meeting.id}`}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Rejoindre la Réunion
                                    </Link>
                                )
                            )}

                            {isOrganizer && (
                                <>
                                    {isPast && meeting.status === 'SCHEDULED' && (
                                        <button
                                            onClick={handleFinalizeWithoutAudio}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <CheckSquare className="w-4 h-4" />
                                            Finaliser sans audio
                                        </button>
                                    )}
                                    {!isPast && (
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="bg-card hover:bg-accent text-foreground font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Modifier
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (confirm(t('meetings.detail.editDeleteConfirm'))) {
                                                try {
                                                    await meetingService.deleteMeeting(meeting.id);
                                                    window.location.href = '/meetings';
                                                } catch (error) {
                                                    alert(t('meetings.detail.editDeleteError'));
                                                }
                                            }
                                        }}
                                        className="bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {t('meetings.detail.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                                <h3 className="text-xl font-bold text-foreground">{t('meetings.detail.editTitle')}</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label htmlFor="edit-title" className="block text-sm font-semibold text-foreground mb-1">{t('meetings.detail.editTitleLabel')}</label>
                                    <input
                                        id="edit-title"
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                                        placeholder={t('meetings.detail.editTitlePlaceholder')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-date" className="block text-sm font-semibold text-foreground mb-1">{t('meetings.detail.editDateLabel')}</label>
                                        <input
                                            id="edit-date"
                                            type="date"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-time" className="block text-sm font-semibold text-foreground mb-1">{t('meetings.detail.editTimeLabel')}</label>
                                        <input
                                            id="edit-time"
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="edit-participants" className="block text-sm font-semibold text-foreground mb-1">{t('meetings.detail.editGuestsLabel')}</label>
                                    <div className="relative mb-2">
                                        <div className="flex gap-2">
                                            <input
                                                id="edit-participants"
                                                type="text"
                                                value={newParticipantEmail}
                                                onChange={(e) => {
                                                    setNewParticipantEmail(e.target.value);
                                                    setShowUserSuggestions(true);
                                                }}
                                                onFocus={() => setShowUserSuggestions(true)}
                                                onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                                                placeholder={t('meetings.detail.editSearchPlaceholder')}
                                                role="combobox"
                                                aria-expanded={showUserSuggestions}
                                                aria-autocomplete="list"
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={addParticipant}
                                                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                aria-label={t('meetings.detail.editAddParticipantAria')}
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {showUserSuggestions && (() => {
                                            const filtered = availableUsers.filter(u => {
                                                if (editParticipants.includes(u.email)) return false;
                                                if (!newParticipantEmail) return true;
                                                const s = newParticipantEmail.toLowerCase();
                                                return u.email.toLowerCase().includes(s) || u.nom.toLowerCase().includes(s) || u.prenom.toLowerCase().includes(s);
                                            });
                                            if (filtered.length === 0) return null;
                                            return (
                                                <ul role="listbox" className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-36 overflow-y-auto">
                                                    {filtered.map((u) => (
                                                        <li key={u.id} role="option" aria-selected={false}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!editParticipants.includes(u.email)) {
                                                                        setEditParticipants([...editParticipants, u.email]);
                                                                    }
                                                                    setNewParticipantEmail('');
                                                                    setShowUserSuggestions(false);
                                                                }}
                                                                className="w-full px-3 py-2.5 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                                                            >
                                                                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-primary font-semibold text-xs">{u.prenom.charAt(0)}{u.nom.charAt(0)}</span>
                                                                </span>
                                                                <span className="min-w-0">
                                                                    <span className="block text-sm font-medium text-foreground truncate">{u.prenom} {u.nom}</span>
                                                                    <span className="block text-xs text-muted-foreground truncate">{u.email}</span>
                                                                </span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {editParticipants.map((email, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border border-border group">
                                                <span className="text-sm text-foreground truncate mr-2">{email} {idx === 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold ml-1">ORGA</span>}</span>
                                                {idx !== 0 && (
                                                    <button onClick={() => removeParticipant(email)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all" aria-label={t('meetings.detail.editRemoveParticipantAria', { email })}>
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-muted/50 border-t border-border flex gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 px-4 bg-card border border-border rounded-xl font-bold text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editTitle}
                                    className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                    {t('meetings.detail.editSave')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (

        <div className="max-w-5xl mx-auto pb-12 relative">
            {/* Report Modal Overlay */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{t('meetings.detail.reportTitle')}</h2>
                                <p className="text-sm text-muted-foreground">{t('meetings.detail.reportSubtitle')}</p>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 hover:bg-accent rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={t('meetings.detail.closeReportAria')}
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Summary Preview */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" /> {t('meetings.detail.reportSummarySection')}
                                </h3>
                                <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 text-foreground prose-sm max-h-48 overflow-y-auto">
                                    {meeting.summary ? (
                                        <ReactMarkdown>{meeting.summary.content}</ReactMarkdown>
                                    ) : (
                                        <div className="flex items-center gap-2 text-primary">
                                            <Loader2 className="w-4 h-4 animate-spin" /> {t('meetings.detail.reportAiGenerating')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {t('meetings.detail.reportViewDetails')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <Link to="/meetings" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-3 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t('meetings.detail.backToMeetings')}
                </Link>
                <h1 className="text-3xl font-bold text-foreground">{meeting.title}</h1>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {new Date(meeting.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm(t('meetings.detail.deleteConfirm'))) {
                                await meetingService.deleteMeeting(meeting.id);
                                window.location.href = '/meetings';
                            }
                        }}
                        className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Trash2 className="w-4 h-4" /> {t('meetings.detail.delete')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Media Player */}
                    {meeting.audioUrl && (
                        <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-border">
                            <video
                                controls
                                className="w-full max-h-[500px] mx-auto"
                                playsInline
                            >
                                <source src={`http://localhost:3000/meetings/${meeting.id}/file`} />
                                {t('meetings.detail.videoNotSupported')}
                            </video>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/80 overflow-hidden min-h-[500px]">
                        <div className="flex border-b border-border" role="tablist" aria-label={t('meetings.detail.sectionsAria')}>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'summary'}
                                onClick={() => setActiveTab('summary')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${activeTab === 'summary' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <FileText className="w-4 h-4" /> {t('meetings.detail.tabs.summary')}
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'transcript'}
                                onClick={() => setActiveTab('transcript')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${activeTab === 'transcript' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <ListVideo className="w-4 h-4" /> {t('meetings.detail.tabs.transcript')}
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'documents'}
                                onClick={() => { setActiveTab('documents'); loadAllDocuments(); }}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${activeTab === 'documents' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <Paperclip className="w-4 h-4" /> {t('meetings.detail.tabs.documents', { count: meetingDocuments.length })}
                            </button>
                        </div>

                        <div className="p-6" role="tabpanel">
                            {activeTab === 'summary' && (
                                <div className="prose prose-sm max-w-none text-foreground">
                                    {meeting.summary ? (
                                        <ReactMarkdown>{meeting.summary.content}</ReactMarkdown>
                                    ) : (meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED') ? (
                                        <EmptyState message={t('meetings.detail.summaryGenerating')} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                                            <p>{t('meetings.detail.summaryEmpty')}</p>
                                            <p className="text-sm mt-2">{t('meetings.detail.summaryEmptyHint')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'transcript' && (
                                <div className="space-y-4">
                                    {meeting.transcript ? (
                                        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                                            {meeting.transcript.content}
                                        </div>
                                    ) : (meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED') ? (
                                        <EmptyState message={t('meetings.detail.transcriptProcessing')} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <ListVideo className="w-12 h-12 mb-3 opacity-20" />
                                            <p>{t('meetings.detail.transcriptEmpty')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <h3 className="font-semibold text-foreground">{t('meetings.detail.documentsAssociated')}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowUploadForm(!showUploadForm)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <Upload className="w-4 h-4" /> {t('meetings.detail.upload')}
                                            </button>
                                            <button
                                                onClick={() => { loadAllDocuments(); setShowAddDocModal(true); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl hover:bg-accent transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <Plus className="w-4 h-4" /> {t('meetings.detail.addExisting')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Upload Form */}
                                    {showUploadForm && (
                                        <div className="p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
                                            <h4 className="font-medium text-foreground flex items-center gap-2">
                                                <Upload className="w-4 h-4 text-primary" /> {t('meetings.detail.uploadNewDoc')}
                                            </h4>
                                            <div>
                                                <label className="block text-xs font-medium text-foreground mb-1">{t('meetings.detail.fileLabel')}</label>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-colors"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-foreground mb-1">{t('meetings.detail.documentNameLabel')}</label>
                                                    <input
                                                        type="text"
                                                        value={uploadName}
                                                        onChange={(e) => setUploadName(e.target.value)}
                                                        placeholder={t('meetings.detail.documentNamePlaceholder')}
                                                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-foreground mb-1">{t('meetings.detail.documentTypeLabel')}</label>
                                                    <select
                                                        value={uploadType}
                                                        onChange={(e) => setUploadType(e.target.value as DocumentType)}
                                                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    >
                                                        <option value={DocumentType.CR_REUNION}>{t('documents.types.minutes')}</option>
                                                        <option value={DocumentType.RAPPORT}>{t('documents.types.report')}</option>
                                                        <option value={DocumentType.ADMINISTRATIF}>{t('documents.types.admin')}</option>
                                                        <option value={DocumentType.PROJET}>{t('documents.types.project')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setShowUploadForm(false);
                                                        setUploadFile(null);
                                                        setUploadName('');
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="flex-1 px-4 py-2 text-sm text-foreground border border-border rounded-xl hover:bg-accent transition-colors"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                                <button
                                                    onClick={handleUploadNewDocument}
                                                    disabled={uploadingDoc || !uploadFile}
                                                    className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    {uploadingDoc ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            {t('meetings.detail.uploading')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4" />
                                                            {t('meetings.detail.uploadAndAssociate')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {loadingDocs ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    ) : meetingDocuments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Paperclip className="w-12 h-12 mb-3 opacity-20" />
                                            <p>{t('meetings.detail.noDocumentsAssociated')}</p>
                                            <p className="text-sm mt-2">{t('meetings.detail.noDocumentsHint')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {meetingDocuments.map((doc) => (
                                                <div key={doc._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{doc.name}</div>
                                                            <div className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB • v{doc.version}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            title={t('meetings.detail.documentDownload')}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveDocument(doc._id)}
                                                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            title={t('meetings.detail.documentRemove')}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Actions */}
                <div className="space-y-6">
                    <div className="bg-card rounded-2xl shadow-sm border border-border/80 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-primary" /> Actions à faire
                            </h3>
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {meeting.actions?.length || 0}
                            </span>
                        </div>
                        <div className="divide-y divide-border">
                            {meeting.actions && meeting.actions.length > 0 ? (
                                meeting.actions.map((action, idx) => (
                                    <div key={idx} className="p-4 hover:bg-accent/50 transition-colors">
                                        <p className="text-sm text-foreground font-medium mb-1">{action.description}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {action.assignee || t('meetings.detail.actionsUnassigned')}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${action.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                                                action.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                {action.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    {t('meetings.detail.actionsEmpty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Add Document Modal */}
            {showAddDocModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Paperclip className="w-5 h-5 text-primary" />
                                {t('meetings.detail.addDocumentModalTitle')}
                            </h3>
                            <button onClick={() => setShowAddDocModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {allDocuments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>{t('meetings.detail.noDocumentsAvailable')}</p>
                                    <p className="text-sm mt-2">{t('meetings.detail.addDocumentsInDocumentsSection')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allDocuments
                                        .filter(doc => !meetingDocuments.some(md => md._id === doc._id))
                                        .map((doc) => (
                                            <button
                                                key={doc._id}
                                                onClick={() => handleAddDocument(doc._id)}
                                                className="w-full flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border hover:bg-accent hover:border-primary/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-foreground truncate">{doc.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {(doc.size / 1024).toFixed(1)} KB • {doc.type}
                                                    </div>
                                                </div>
                                                <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                                            </button>
                                        ))}
                                    {allDocuments.filter(doc => !meetingDocuments.some(md => md._id === doc._id)).length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {t('meetings.detail.allDocumentsAssociated')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-50" />
        <p>{message}</p>
    </div>
);
