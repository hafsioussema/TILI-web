import { useState, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { DocumentType, type CreateDocumentDto, type Project } from '@/types/documents';
import { documentService } from '../documentService';
import { projectService } from '@/features/projects/projectService';
import { cn } from '@/lib/utils';

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
    const [formData, setFormData] = useState<CreateDocumentDto>({
        name: '',
        type: DocumentType.PROJET,
        projectId: initialProjectId || '',
        description: '',
    });

    // Fetch projects on mount
    useState(() => {
        projectService.getAll().then(setProjects).catch(console.error);
    });

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
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: selectedFile.name.replace(/\.[^/.]+$/, '') }));
            }
        }
    };

    const handleSubmit = async () => {
        if (!file || !formData.projectId) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await documentService.upload(file, formData);
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
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">
                        Ajouter un document
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                            isDragging
                                ? "border-primary bg-primary/5"
                                : file
                                    ? "border-green-500 bg-green-500/5"
                                    : "border-border hover:border-primary/50"
                        )}
                    >
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                                        <FileText className="h-6 w-6 text-green-500" />
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
                                        <Upload className="h-6 w-6 text-primary" />
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
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Nom du document
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Entrez le nom..."
                                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {Object.entries(typeLabels).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Projet
                                </label>
                                <select
                                    value={formData.projectId}
                                    onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Sélectionnez...</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Description (optionnel)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <PremiumButton
                        onClick={handleSubmit}
                        disabled={!file || !formData.projectId || isUploading}
                    >
                        {isUploading ? (
                            isSuccess ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Terminé
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Upload...
                                </>
                            )
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </PremiumButton>
                </div>
            </motion.div>
        </motion.div>
    );
};
