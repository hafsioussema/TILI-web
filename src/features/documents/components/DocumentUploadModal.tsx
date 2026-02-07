import { useState, type DragEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { DocumentType, type CreateDocumentDto, type Project } from '@/types/documents';
import { documentService } from '../documentService';
import { projectService } from '@/features/projects/projectService';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/useKeyboardNavigation';

interface DocumentUploadModalProps {
    initialProjectId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const typeLabels: Record<DocumentType, string> = {
    [DocumentType.RAPPORT]: 'Rapport',
    [DocumentType.CR_REUNION]: 'Compte rendu',
    [DocumentType.ADMINISTRATIF]: 'Administratif',
    [DocumentType.PROJET]: 'Document de projet',
};

export const DocumentUploadModal = ({ initialProjectId, onClose, onSuccess }: DocumentUploadModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    
    const [formData, setFormData] = useState<CreateDocumentDto>({
        name: '',
        type: DocumentType.PROJET,
        projectId: initialProjectId || '',
        description: '',
    });

    // Implement focus trap
    useFocusTrap(modalRef, true);

    // Fetch projects on mount
    useEffect(() => {
        projectService.getAll().then(setProjects).catch(console.error);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Close modal with Escape
        if (e.key === 'Escape') {
            onClose();
        }
        // Submit with Ctrl+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: droppedFile.name.replace(/\.[^/.]+$/, '') }));
            }
            // Clear validation error
            setValidationErrors(prev => ({ ...prev, file: '' }));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: selectedFile.name.replace(/\.[^/.]+$/, '') }));
            }
            setValidationErrors(prev => ({ ...prev, file: '' }));
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        if (!file) {
            errors.file = 'Veuillez sélectionner un fichier';
        }
        if (!formData.name?.trim()) {
            errors.name = 'Le nom du document est requis';
        }
        if (!formData.projectId) {
            errors.projectId = 'Veuillez sélectionner un projet';
        }
        
        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            const errorCount = Object.keys(errors).length;
            const announcement = errorCount === 1 
                ? '1 erreur de validation' 
                : `${errorCount} erreurs de validation`;
            const announcer = document.getElementById('route-announcer');
            if (announcer) {
                announcer.textContent = announcement;
            }
        }
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await documentService.upload(file!, formData);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setIsSuccess(true);
            toast.success('Document ajouté avec succès');
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (error) {
            console.error('Upload failed:', error);
            clearInterval(progressInterval);
            setIsUploading(false);
            toast.error('Erreur lors de l\'ajout du document');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-modal-title"
                aria-describedby="upload-modal-description"
                onKeyDown={handleKeyDown}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 id="upload-modal-title" className="text-xl font-semibold text-foreground">
                        Ajouter un document
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Fermer le modal (Échap)"
                        title="Fermer (Échap)"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {Object.keys(validationErrors).length > 0 && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                        >
                            Veuillez corriger les erreurs ci-dessous
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
                            isDragging
                                ? "border-primary bg-primary/5"
                                : file
                                    ? "border-green-500 bg-green-500/5"
                                    : "border-border hover:border-primary/50"
                        )}
                        role="button"
                        tabIndex={0}
                        aria-label="Zone de dépôt de fichier ou cliquez pour sélectionner"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-hidden="true"
                            tabIndex={-1}
                        />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                                        <FileText className="h-6 w-6 text-green-500" aria-hidden="true" />
                                    </div>
                                    <p className="font-medium text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                        <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                                    </div>
                                    <p className="font-medium text-foreground">
                                        Glissez-déposez un fichier
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        ou cliquez pour sélectionner
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {validationErrors.file && (
                            <p className="text-xs text-destructive mt-2">{validationErrors.file}</p>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="doc-name" className="block text-sm font-medium text-foreground mb-1.5">
                                Nom du document <span className="text-destructive" aria-label="requis">*</span>
                            </label>
                            <input
                                id="doc-name"
                                type="text"
                                autoFocus
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Entrez le nom..."
                                aria-required="true"
                                aria-invalid={!!validationErrors.name}
                                aria-describedby={validationErrors.name ? "name-error" : undefined}
                                className={cn(
                                    "w-full px-4 py-2.5 rounded-xl bg-secondary border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                                    validationErrors.name ? "border-destructive" : "border-border"
                                )}
                            />
                            {validationErrors.name && (
                                <p id="name-error" className="text-xs text-destructive mt-1">{validationErrors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="doc-type" className="block text-sm font-medium text-foreground mb-1.5">
                                    Type
                                </label>
                                <select
                                    id="doc-type"
                                    value={formData.type}
                                    onChange={e => handleChange('type', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                >
                                    {Object.entries(typeLabels).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="doc-project" className="block text-sm font-medium text-foreground mb-1.5">
                                    Projet <span className="text-destructive" aria-label="requis">*</span>
                                </label>
                                <select
                                    id="doc-project"
                                    value={formData.projectId}
                                    onChange={e => handleChange('projectId', e.target.value)}
                                    aria-required="true"
                                    aria-invalid={!!validationErrors.projectId}
                                    aria-describedby={validationErrors.projectId ? "project-error" : undefined}
                                    className={cn(
                                        "w-full px-4 py-2.5 rounded-xl bg-secondary border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer",
                                        validationErrors.projectId ? "border-destructive" : "border-border"
                                    )}
                                >
                                    <option value="">Sélectionnez...</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                                {validationErrors.projectId && (
                                    <p id="project-error" className="text-xs text-destructive mt-1">{validationErrors.projectId}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="doc-description" className="block text-sm font-medium text-foreground mb-1.5">
                                Description (optionnel)
                            </label>
                            <textarea
                                id="doc-description"
                                value={formData.description}
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Décrivez le document..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                    <div className="px-6 pb-2">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    isSuccess ? "bg-green-500" : "bg-primary"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0.3 }}
                                role="progressbar"
                                aria-valuenow={uploadProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Upload progress"
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Annuler et fermer"
                    >
                        Annuler
                    </button>
                    <PremiumButton
                        onClick={handleSubmit}
                        disabled={!file || !formData.projectId || isUploading}
                        aria-label={isUploading ? "Upload en cours..." : "Enregistrer le document"}
                    >
                        {isUploading ? (
                            isSuccess ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Terminé
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                                    Upload...
                                </>
                            )
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                                Enregistrer
                            </>
                        )}
                    </PremiumButton>
                </div>
            </motion.div>
        </motion.div>
    );
};
