import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, FileImage, File, Upload, Download, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { UserRole, type TiliDocument, DocumentType } from '@/types/documents';
import { documentService } from '../documentService';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentHistoryModal } from './DocumentHistoryModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface ProjectDocumentsProps {
    projectId: string;
}

const typeLabels: Record<DocumentType, string> = {
    [DocumentType.RAPPORT]: 'Rapport',
    [DocumentType.CR_REUNION]: 'CR Réunion',
    [DocumentType.ADMINISTRATIF]: 'Administratif',
    [DocumentType.PROJET]: 'Projet',
};

const typeIcons: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
    [DocumentType.RAPPORT]: FileText,
    [DocumentType.CR_REUNION]: FileSpreadsheet,
    [DocumentType.ADMINISTRATIF]: File,
    [DocumentType.PROJET]: FileImage,
};

export const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
    const { user } = useAuthStore();
    const [documents, setDocuments] = useState<TiliDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocForHistory, setSelectedDocForHistory] = useState<TiliDocument | null>(null);
    const [selectedDocForPreview, setSelectedDocForPreview] = useState<TiliDocument | null>(null);

    const canUpload = user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const docs = await documentService.getAll({ projectId });
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to fetch project documents:', error);
            toast.error('Erreur lors du chargement des documents');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDownload = async (doc: TiliDocument) => {
        const toastId = toast.loading(`Téléchargement de ${doc.name}...`);
        try {
            await documentService.download(doc._id, doc.name);
            toast.success('Téléchargement terminé', { id: toastId });
        } catch (error) {
            toast.error('Erreur de téléchargement', { id: toastId });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-secondary/50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Documents du projet ({documents.length})
                </h3>
                {canUpload && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                    >
                        <Upload size={14} /> Ajouter
                    </button>
                )}
            </div>

            {documents.length === 0 ? (
                <AnimatedCard className="p-8 text-center border-dashed border-2">
                    <p className="text-sm text-muted-foreground mb-4">Aucun document associé à ce projet.</p>
                    {canUpload && (
                        <PremiumButton size="sm" onClick={() => setShowUploadModal(true)}>
                            Uploader le premier document
                        </PremiumButton>
                    )}
                </AnimatedCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {documents.map((doc) => {
                            const Icon = typeIcons[doc.type] || File;
                            return (
                                <motion.div
                                    key={doc._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <AnimatedCard className="p-4 group hover:border-primary/30 transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium truncate mb-1" title={doc.name}>
                                                    {doc.name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <span>{typeLabels[doc.type]}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(doc.size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedDocForPreview(doc)}
                                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <Eye className="h-3 w-3" /> Aperçu
                                            </button>
                                            <button
                                                onClick={() => setSelectedDocForHistory(doc)}
                                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <Clock className="h-3 w-3" /> Historique
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="text-[10px] font-medium text-primary hover:text-primary/70 flex items-center gap-1"
                                            >
                                                <Download className="h-3 w-3" /> Télécharger
                                            </button>
                                        </div>
                                    </AnimatedCard>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {showUploadModal && (
                <DocumentUploadModal
                    initialProjectId={projectId}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        fetchDocuments();
                    }}
                />
            )}

            {selectedDocForHistory && (
                <DocumentHistoryModal
                    document={selectedDocForHistory}
                    onClose={() => setSelectedDocForHistory(null)}
                />
            )}

            {selectedDocForPreview && (
                <DocumentPreviewModal
                    document={selectedDocForPreview}
                    onClose={() => setSelectedDocForPreview(null)}
                />
            )}
        </div>
    );
};
