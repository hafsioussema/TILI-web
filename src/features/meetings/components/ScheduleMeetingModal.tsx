import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Clock, Users, X, Loader2, Paperclip, FileText, Check, Upload, Plus } from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { documentService } from '../../documents/documentService';
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
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [participantsStr, setParticipantsStr] = useState('');
  const [minPresenceDuration, setMinPresenceDuration] = useState('0');
  const [loading, setLoading] = useState(false);
  
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

  // Load documents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

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
      const participants = participantsStr
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      // Combine date and time into ISO string
      const dateTime = new Date(`${date}T${time}`).toISOString();

      const meeting = await meetingService.createMeeting({
        title: title || 'New Meeting',
        date: dateTime,
        participants,
        minPresenceDuration: parseInt(minPresenceDuration) || 0,
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
      setParticipantsStr('');
      setMinPresenceDuration('0');
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <Dialog.Title className="text-xl font-bold text-slate-900">
              Schedule a Meeting
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Team Standup"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Clock size={16} />
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Users size={16} />
                Participants (comma-separated emails)
              </label>
              <textarea
                value={participantsStr}
                onChange={(e) => setParticipantsStr(e.target.value)}
                placeholder="alice@example.com, bob@example.com"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Min Presence Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Presence Duration (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={minPresenceDuration}
                onChange={(e) => setMinPresenceDuration(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Participants need to stay for this duration to be marked as present
              </p>
            </div>

            {/* Documents Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Paperclip size={16} />
                Documents associés
              </label>
              
              {/* Selected documents preview */}
              {selectedDocumentIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedDocumentIds.map(id => {
                    const doc = allDocuments.find(d => d._id === id);
                    return doc ? (
                      <span 
                        key={id} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        <FileText size={14} />
                        {doc.name}
                        <button
                          type="button"
                          onClick={() => toggleDocumentSelection(id)}
                          className="ml-1 hover:text-blue-900"
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
                className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Paperclip size={16} />
                {selectedDocumentIds.length > 0 
                  ? `${selectedDocumentIds.length} document(s) sélectionné(s)` 
                  : 'Sélectionner des documents'}
              </button>

              {/* Document picker dropdown */}
              {showDocPicker && (
                <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  {loadingDocs ? (
                    <div className="p-4 text-center text-slate-500">
                      <Loader2 className="animate-spin inline mr-2" size={16} />
                      Chargement...
                    </div>
                  ) : allDocuments.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      Aucun document disponible
                    </div>
                  ) : (
                    allDocuments.map(doc => (
                      <div
                        key={doc._id}
                        onClick={() => toggleDocumentSelection(doc._id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 ${
                          selectedDocumentIds.includes(doc._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedDocumentIds.includes(doc._id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-slate-300'
                        }`}>
                          {selectedDocumentIds.includes(doc._id) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <FileText size={16} className="text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.type}</p>
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
                className="mt-2 w-full px-3 py-2 border border-dashed border-green-300 rounded-lg text-green-600 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Uploader un nouveau document
              </button>

              {/* Upload form */}
              {showUploadForm && (
                <div className="mt-2 p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
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
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nom du document
                    </label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Nom du document"
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Type
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as DocumentType)}
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                      className="flex-1 px-3 py-1 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadNewDocument}
                      disabled={uploadingDoc || !uploadFile}
                      className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
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
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
