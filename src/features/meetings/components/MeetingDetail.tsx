
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { documentService } from '../../documents/documentService';
import type { Meeting } from '../types';
import type { TiliDocument } from '@/types/documents';
import { DocumentType } from '@/types/documents';
import { useAuthStore } from '../../auth/useAuthStore';
import { Loader2, ArrowLeft, Calendar, FileText, CheckSquare, ListVideo, AlertCircle, Trash2, Users, Pencil, Plus, X, Check, Paperclip, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown'; // Assuming standard markdown renderer or just plain text

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
    const [isSaving, setIsSaving] = useState(false);

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
                setError("Accès refusé. Vous n'êtes pas invité à cette réunion.");
            } else if (e.response?.status === 404) {
                setError("Réunion introuvable.");
            } else {
                setError("Une erreur est survenue lors du chargement.");
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
            alert('Erreur lors de l\'ajout du document');
        }
    };

    const handleRemoveDocument = async (documentId: string) => {
        if (!meeting) return;
        if (!confirm('Êtes-vous sûr de vouloir retirer ce document de la réunion ?')) return;
        try {
            await meetingService.removeDocument(meeting.id, documentId);
            loadMeetingDocuments(meeting.id);
        } catch (err) {
            console.error('Failed to remove document:', err);
            alert('Erreur lors du retrait du document');
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
            toast.error('Veuillez sélectionner un fichier et entrer un nom');
            return;
        }

        setUploadingDoc(true);
        try {
            const newDoc = await documentService.upload(uploadFile, {
                name: uploadName,
                type: uploadType,
                projectId: '',
                description: `Document associé à la réunion: ${meeting.title}`,
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
            
            toast.success('Document uploadé et associé à la réunion');
        } catch (error) {
            console.error('Failed to upload document:', error);
            toast.error('Échec de l\'upload du document');
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
            alert('Réunion mise à jour avec succès. Un email a été envoyé aux participants.');
        } catch (err) {
            console.error('Failed to update meeting:', err);
            alert('Échec de la mise à jour de la réunion.');
        } finally {
            setIsSaving(false);
        }
    };

    const addParticipant = () => {
        if (newParticipantEmail && !editParticipants.includes(newParticipantEmail)) {
            if (!newParticipantEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                alert('Veuillez entrer une adresse email valide.');
                return;
            }
            setEditParticipants([...editParticipants, newParticipantEmail]);
            setNewParticipantEmail('');
        }
    };

    const removeParticipant = (email: string) => {
        // Organizer cannot be removed (assuming first is organizer)
        if (editParticipants.indexOf(email) === 0) {
            alert("L'organisateur ne peut pas être retiré.");
            return;
        }
        setEditParticipants(editParticipants.filter(p => p !== email));
    };

    const handleFinalizeWithoutAudio = async () => {
        if (!meeting) return;
        if (!confirm('Voulez-vous finaliser cette réunion sans enregistrement audio ? Un résumé AI sera généré avec les informations disponibles.')) {
            return;
        }
        try {
            toast.info('Finalisation en cours...');
            await meetingService.finalizeWithoutAudio(meeting.id);
            toast.success('Réunion finalisée avec succès !');
            loadMeeting(meeting.id);
        } catch (error) {
            console.error('Failed to finalize meeting:', error);
            toast.error('Échec de la finalisation de la réunion');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    if (error) return (
        <div className="max-w-xl mx-auto py-12 text-center px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Link to="/meetings" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Retour au tableau de bord
            </Link>
        </div>
    );

    if (!meeting) return <div>Meeting not found</div>;

    if (meeting.status === 'FAILED') {
        return (
            <div className="max-w-5xl mx-auto py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Failed</h2>
                <p className="text-slate-500 mb-6">Something went wrong while processing this meeting.</p>
                <Link to="/meetings" className="text-blue-600 hover:underline">Back to Meetings</Link>
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
                <Link to="/meetings" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Meetings
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold text-white uppercase">
                                        📅 Planifiée
                                    </span>
                                    {isPast && (
                                        <span className="px-3 py-1 bg-red-500/80 backdrop-blur rounded-full text-xs font-semibold text-white uppercase">
                                            ⚠️ Passée
                                        </span>
                                    )}
                                    {isToday && !isPast && (
                                        <span className="px-3 py-1 bg-green-500/80 backdrop-blur rounded-full text-xs font-semibold text-white uppercase animate-pulse">
                                            🔴 Aujourd'hui
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">{meeting.title}</h1>
                                <div className="flex items-center gap-4 text-white/90 text-sm">
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
                                        🕐 {meetingDate.toLocaleTimeString('fr-FR', {
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
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Participants Invités ({participants.length})
                            </h2>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                                {participants.length === 0 ? (
                                    <div className="p-4 text-slate-500 text-center">Aucun participant invité</div>
                                ) : (
                                    participants.map((email, index) => (
                                        <div key={index} className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {email.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{email}</div>
                                                <div className="text-xs text-slate-500">{index === 0 ? 'Organisateur' : 'Invité'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 mb-2">
                                        {isPast ? "Cette réunion est passée" : "Réunion à venir"}
                                    </h3>
                                    <p className="text-sm text-blue-700">
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
                                <div className="flex-1 bg-slate-100 text-slate-500 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                                    <Check className="w-5 h-5" />
                                    Réunion terminée
                                </div>
                            ) : (
                                (!isPast || isToday) && (
                                    <Link
                                        to={`/meet/${meeting.id}`}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        🎥 Rejoindre la Réunion
                                    </Link>
                                )
                            )}

                            {isOrganizer && (
                                <>
                                    {isPast && meeting.status === 'SCHEDULED' && (
                                        <button
                                            onClick={handleFinalizeWithoutAudio}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckSquare className="w-4 h-4" />
                                            Finaliser sans audio
                                        </button>
                                    )}
                                    {!isPast && (
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Modifier
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (confirm('Êtes-vous sûr de vouloir supprimer cette réunion planifiée ? Tous les participants seront notifiés par email.')) {
                                                try {
                                                    await meetingService.deleteMeeting(meeting.id);
                                                    window.location.href = '/meetings';
                                                } catch (error) {
                                                    alert('Erreur lors de la suppression');
                                                }
                                            }
                                        }}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-800">Modifier la réunion</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Titre de la réunion</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: Weekly Sync"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Heure</label>
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Invités</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="email"
                                            value={newParticipantEmail}
                                            onChange={(e) => setNewParticipantEmail(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="email@example.com"
                                        />
                                        <button
                                            onClick={addParticipant}
                                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {editParticipants.map((email, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                                                <span className="text-sm text-slate-600 truncate mr-2">{email} {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold ml-1">ORGA</span>}</span>
                                                {idx !== 0 && (
                                                    <button onClick={() => removeParticipant(email)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editTitle}
                                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                    Enregistrer
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Meeting Report</h2>
                                <p className="text-sm text-slate-500">Summary & Attendance</p>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <Users className="w-5 h-5 text-slate-500" /> Close
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Attendance Highlight */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" /> Attendance Overview
                                </h3>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                                    {(() => {
                                        try {
                                            const attendance = meeting.attendance ? JSON.parse(meeting.attendance) : {};
                                            const entries = Object.entries(attendance);
                                            if (entries.length === 0) return <div className="p-4 text-slate-500">No data available.</div>;

                                            // Calculate Stats
                                            const total = entries.length;
                                            const present = entries.filter(([, d]: any) => d.status === 'PRESENT').length;
                                            const absent = total - present;

                                            return (
                                                <>
                                                    <div className="p-4 grid grid-cols-3 gap-4 text-center">
                                                        <div>
                                                            <div className="text-2xl font-bold text-slate-900">{total}</div>
                                                            <div className="text-xs text-slate-500 font-medium uppercase">Invited</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold text-green-600">{present}</div>
                                                            <div className="text-xs text-slate-500 font-medium uppercase">Present</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold text-red-600">{absent}</div>
                                                            <div className="text-xs text-slate-500 font-medium uppercase">Absent</div>
                                                        </div>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto">
                                                        {entries.map(([email, data]: any) => {
                                                            const seconds = data.duration;
                                                            let durationText = `${seconds}s`;
                                                            if (seconds >= 60) {
                                                                const m = Math.floor(seconds / 60);
                                                                const s = seconds % 60;
                                                                durationText = s > 0 ? `${m}m ${s}s` : `${m}m`;
                                                            }
                                                            return (
                                                                <div key={email} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-2 h-2 rounded-full ${data.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                        <span className="font-medium text-slate-700">{email}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xs text-slate-400 font-mono">{durationText}</span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${data.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {data.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        } catch (e) {
                                            return <div className="p-4 text-red-500">Error parsing data.</div>;
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Key Takeaways Preview */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" /> Summary Preview
                                </h3>
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 text-slate-700 prose-sm max-h-48 overflow-y-auto">
                                    {meeting.summary ? (
                                        <ReactMarkdown>{meeting.summary.content}</ReactMarkdown>
                                    ) : (
                                        <div className="flex items-center gap-2 text-purple-600">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Generating AI Summary...
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                View Full Details & Recording
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <Link to="/meetings" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-3">
                    <ArrowLeft className="w-4 h-4" /> Back to Meetings
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">{meeting.title}</h1>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {new Date(meeting.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this meeting?')) {
                                await meetingService.deleteMeeting(meeting.id);
                                window.location.href = '/meetings';
                            }
                        }}
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Meeting
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Media Player (Video or Audio) */}
                    {meeting.audioUrl && (
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
                            <video
                                controls
                                className="w-full max-h-[500px] mx-auto"
                                playsInline
                            >
                                <source src={`http://localhost:3000/meetings/${meeting.id}/file`} />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText className="w-4 h-4" /> Smart Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('transcript')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <ListVideo className="w-4 h-4" /> Full Transcript
                            </button>
                            <button
                                onClick={() => { setActiveTab('documents'); loadAllDocuments(); }}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Paperclip className="w-4 h-4" /> Documents ({meetingDocuments.length})
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'summary' && (
                                <div className="prose prose-sm max-w-none text-slate-700">
                                    {meeting.summary ? (
                                        <ReactMarkdown>{meeting.summary.content}</ReactMarkdown>
                                    ) : (meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED') ? (
                                        <EmptyState message="L'IA génère le résumé..." />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Aucun résumé disponible.</p>
                                            <p className="text-sm mt-2">L'enregistrement audio est manquant ou trop court.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'transcript' && (
                                <div className="space-y-4">
                                    {meeting.transcript ? (
                                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {meeting.transcript.content}
                                        </div>
                                    ) : (meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED') ? (
                                        <EmptyState message="Transcription en cours..." />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <ListVideo className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Aucune transcription disponible.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <h3 className="font-semibold text-slate-800">Documents associés</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowUploadForm(!showUploadForm)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                <Upload className="w-4 h-4" /> Uploader
                                            </button>
                                            <button
                                                onClick={() => { loadAllDocuments(); setShowAddDocModal(true); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                <Plus className="w-4 h-4" /> Ajouter existant
                                            </button>
                                        </div>
                                    </div>

                                    {/* Upload Form */}
                                    {showUploadForm && (
                                        <div className="p-4 border border-green-200 rounded-lg bg-green-50 space-y-3">
                                            <h4 className="font-medium text-green-800 flex items-center gap-2">
                                                <Upload className="w-4 h-4" /> Uploader un nouveau document
                                            </h4>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                                    Fichier
                                                </label>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    className="w-full text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                                        Nom du document
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={uploadName}
                                                        onChange={(e) => setUploadName(e.target.value)}
                                                        placeholder="Nom du document"
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                                        Type
                                                    </label>
                                                    <select
                                                        value={uploadType}
                                                        onChange={(e) => setUploadType(e.target.value as DocumentType)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value={DocumentType.CR_REUNION}>Compte Rendu Réunion</option>
                                                        <option value={DocumentType.RAPPORT}>Rapport</option>
                                                        <option value={DocumentType.ADMINISTRATIF}>Administratif</option>
                                                        <option value={DocumentType.PROJET}>Projet</option>
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
                                                    className="flex-1 px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={handleUploadNewDocument}
                                                    disabled={uploadingDoc || !uploadFile}
                                                    className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {uploadingDoc ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Upload...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4" />
                                                            Uploader et associer
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {loadingDocs ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : meetingDocuments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <Paperclip className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Aucun document associé à cette réunion.</p>
                                            <p className="text-sm mt-2">Cliquez sur "Ajouter un document" pour en associer.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {meetingDocuments.map((doc) => (
                                                <div key={doc._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-800">{doc.name}</div>
                                                            <div className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB • v{doc.version}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                                            title="Télécharger"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveDocument(doc._id)}
                                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                                            title="Retirer"
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-blue-600" /> Action Items
                            </h3>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {meeting.actions?.length || 0}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {meeting.actions && meeting.actions.length > 0 ? (
                                meeting.actions.map((action, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                        <p className="text-sm text-slate-800 font-medium mb-1">{action.description}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-slate-500">
                                                {action.assignee || 'Unassigned'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${action.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                action.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {action.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No actions detected yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance Report */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" /> Attendance Report
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {meeting.attendance ? (
                            (() => {
                                try {
                                    const attendance = JSON.parse(meeting.attendance);
                                    const entries = Object.entries(attendance);
                                    if (entries.length === 0) {
                                        return <div className="p-4 text-sm text-slate-500">No attendance data.</div>;
                                    }
                                    return entries.map(([email, data]: any) => {
                                        // Improved duration logic
                                        const seconds = data.duration;
                                        let durationText = `${seconds}s`;
                                        if (seconds >= 60) {
                                            const m = Math.floor(seconds / 60);
                                            const s = seconds % 60;
                                            durationText = s > 0 ? `${m}m ${s}s` : `${m}m`;
                                        }

                                        const status = data.status;
                                        const showStatus = status !== 'N/A' && status !== 'INFO';

                                        return (
                                            <div key={email} className="p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-800">{email}</div>
                                                    <div className="text-xs text-slate-500">Duration: {durationText}</div>
                                                </div>
                                                {showStatus && (
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    });
                                } catch (e) {
                                    return <div className="p-4 text-sm text-red-500">Error loading attendance.</div>;
                                }
                            })()
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                                {(meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED') ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mb-2 opacity-50" />
                                        <span className="opacity-70">Génération du rapport...</span>
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-6 h-6 mb-2 opacity-20" />
                                        <p>Aucune donnée de présence.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Document Modal */}
            {showAddDocModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Paperclip className="w-5 h-5 text-blue-600" />
                                Associer un document
                            </h3>
                            <button onClick={() => setShowAddDocModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {allDocuments.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Aucun document disponible.</p>
                                    <p className="text-sm mt-2">Ajoutez des documents dans la section Documents.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allDocuments
                                        .filter(doc => !meetingDocuments.some(md => md._id === doc._id))
                                        .map((doc) => (
                                            <button
                                                key={doc._id}
                                                onClick={() => handleAddDocument(doc._id)}
                                                className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-800 truncate">{doc.name}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {(doc.size / 1024).toFixed(1)} KB • {doc.type}
                                                    </div>
                                                </div>
                                                <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            </button>
                                        ))}
                                    {allDocuments.filter(doc => !meetingDocuments.some(md => md._id === doc._id)).length === 0 && (
                                        <div className="text-center py-4 text-slate-500">
                                            Tous les documents sont déjà associés.
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
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-50" />
        <p>{message}</p>
    </div>
);
