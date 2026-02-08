import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Clock, Users, X, Loader2, Paperclip, FileText, Check, Upload, Plus } from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { documentService } from '../../documents/documentService';
import { userService } from '../../users/userService';
import { useAuthStore } from '../../auth/useAuthStore';
import type { User } from '@/types';
import type { TiliDocument } from '@/types/documents';
import { DocumentType } from '@/types/documents';
import { toast } from 'sonner';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user: currentUser } = useAuthStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const participantInputRef = useRef<HTMLInputElement>(null);
  
  // Documents state
  const [allDocuments, setAllDocuments] = useState<TiliDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Upload new document state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.CR_REUNION);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents and users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      loadUsers();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (participantInputRef.current && !participantInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadUsers = async () => {
    try {
      const users = await userService.getAll();
      setAvailableUsers(users.filter(u => u.isActive));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const filteredUsers = availableUsers.filter(u => {
    if (u.email === currentUser?.email) return false;
    if (selectedParticipants.includes(u.email)) return false;
    if (!participantSearch) return true;
    const search = participantSearch.toLowerCase();
    return u.email.toLowerCase().includes(search) ||
      u.nom.toLowerCase().includes(search) ||
      u.prenom.toLowerCase().includes(search);
  });

  const addParticipant = (email: string) => {
    if (!selectedParticipants.includes(email)) {
      setSelectedParticipants([...selectedParticipants, email]);
    }
    setParticipantSearch('');
    setShowUserDropdown(false);
  };

  const removeParticipant = (email: string) => {
    setSelectedParticipants(selectedParticipants.filter(e => e !== email));
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const docs = await documentService.getAllDocuments();
      setAllDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocumentIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
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
    if (!uploadFile || !uploadName) {
      toast.error('Veuillez sélectionner un fichier et entrer un nom');
      return;
    }

    setUploadingDoc(true);
    try {
      const newDoc = await documentService.upload(uploadFile, {
        name: uploadName,
        type: uploadType,
        projectId: '', // Will be empty for meeting documents
        description: `Document associé à la réunion`,
      });
      
      // Add to selected documents
      setSelectedDocumentIds(prev => [...prev, newDoc._id]);
      setAllDocuments(prev => [...prev, newDoc]);
      
      // Reset upload form
      setUploadFile(null);
      setUploadName('');
      setUploadType(DocumentType.CR_REUNION);
      setShowUploadForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      toast.success('Document uploadé et ajouté');
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Échec de l\'upload du document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participants = [...selectedParticipants];

      // Combine date and time into ISO string
      const dateTime = new Date(`${date}T${time}`).toISOString();

      const meeting = await meetingService.createMeeting({
        title: title || 'New Meeting',
        date: dateTime,
        participants,
      });

      // Associate selected documents to the meeting
      if (selectedDocumentIds.length > 0 && meeting?.id) {
        for (const docId of selectedDocumentIds) {
          try {
            await meetingService.addDocument(meeting.id, docId);
          } catch (err) {
            console.error(`Failed to add document ${docId}:`, err);
          }
        }
      }

      toast.success('Meeting scheduled successfully');

      // Reset form
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('14:00');
      setSelectedParticipants([]);
      setParticipantSearch('');
      setSelectedDocumentIds([]);
      setShowDocPicker(false);

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-xl"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-border p-6">
            <Dialog.Title className="text-xl font-bold text-foreground">
              Planifier une réunion
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Fermer">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Titre */}
            <div>
              <label htmlFor="schedule-title" className="block text-sm font-medium text-foreground mb-1.5">
                Titre de la réunion
              </label>
              <input
                id="schedule-title"
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Réunion d'équipe"
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
              />
            </div>

            {/* Date & Heure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="schedule-date" className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                  <Calendar size={16} className="text-muted-foreground" />
                  Date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="schedule-time" className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                  <Clock size={16} className="text-muted-foreground" />
                  Heure
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                />
              </div>
            </div>

            {/* Participants */}
            <div>
              <label htmlFor="schedule-participants" className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Users size={16} className="text-muted-foreground" />
                Participants
              </label>
              <div className="relative">
                <input
                  id="schedule-participants"
                  ref={participantInputRef}
                  type="text"
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  role="combobox"
                  aria-expanded={showUserDropdown && filteredUsers.length > 0}
                  aria-autocomplete="list"
                  autoComplete="off"
                />
                {showUserDropdown && filteredUsers.length > 0 && (
                  <ul role="listbox" className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <li key={u.id} role="option" aria-selected={false}>
                        <button
                          type="button"
                          onClick={() => addParticipant(u.email)}
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
                )}
              </div>
              {/* Chips participants */}
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Participants sélectionnés">
                  {selectedParticipants.map((email) => {
                    const u = availableUsers.find(u => u.email === email);
                    return (
                      <span key={email} role="listitem" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                        {u ? `${u.prenom} ${u.nom}` : email}
                        <button type="button" onClick={() => removeParticipant(email)} className="hover:text-destructive transition-colors" aria-label={`Retirer ${u ? `${u.prenom} ${u.nom}` : email}`}>
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <span className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Paperclip size={16} className="text-muted-foreground" />
                Documents associés
              </span>
              
              {/* Selected documents preview */}
              {selectedDocumentIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedDocumentIds.map(id => {
                    const doc = allDocuments.find(d => d._id === id);
                    return doc ? (
                      <span 
                        key={id} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                      >
                        <FileText size={14} />
                        {doc.name}
                        <button
                          type="button"
                          onClick={() => toggleDocumentSelection(id)}
                          className="ml-1 hover:text-destructive transition-colors"
                          aria-label={`Retirer ${doc.name}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowDocPicker(!showDocPicker)}
                className="w-full px-3.5 py-2.5 border border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Paperclip size={16} />
                {selectedDocumentIds.length > 0 
                  ? `${selectedDocumentIds.length} document(s) sélectionné(s)` 
                  : 'Sélectionner des documents'}
              </button>

              {/* Document picker dropdown */}
              {showDocPicker && (
                <div className="mt-2 border border-border rounded-xl max-h-48 overflow-y-auto" role="listbox" aria-label="Documents disponibles">
                  {loadingDocs ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="animate-spin inline mr-2" size={16} />
                      Chargement...
                    </div>
                  ) : allDocuments.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Aucun document disponible
                    </div>
                  ) : (
                    allDocuments.map(doc => (
                      <div
                        key={doc._id}
                        role="option"
                        aria-selected={selectedDocumentIds.includes(doc._id)}
                        onClick={() => toggleDocumentSelection(doc._id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent border-b border-border/50 last:border-b-0 transition-colors ${
                          selectedDocumentIds.includes(doc._id) ? 'bg-accent' : ''
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedDocumentIds.includes(doc._id) 
                            ? 'bg-primary border-primary' 
                            : 'border-input'
                        }`}>
                          {selectedDocumentIds.includes(doc._id) && (
                            <Check size={14} className="text-primary-foreground" />
                          )}
                        </div>
                        <FileText size={16} className="text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Upload new document button */}
              <button
                type="button"
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="mt-2 w-full px-3.5 py-2.5 border border-dashed border-primary/30 rounded-xl text-primary hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Upload size={16} />
                Uploader un nouveau document
              </button>

              {/* Upload form */}
              {showUploadForm && (
                <div className="mt-2 p-3 border border-border rounded-xl bg-muted/50 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Fichier</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Nom du document</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Nom du document"
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as DocumentType)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value={DocumentType.CR_REUNION}>Compte Rendu Réunion</option>
                      <option value={DocumentType.RAPPORT}>Rapport</option>
                      <option value={DocumentType.ADMINISTRATIF}>Administratif</option>
                      <option value={DocumentType.PROJET}>Projet</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="flex-1 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadNewDocument}
                      disabled={uploadingDoc || !uploadFile}
                      className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                    >
                      {uploadingDoc ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Ajouter
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 text-foreground border border-border rounded-xl hover:bg-accent font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Planification...' : 'Planifier'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
