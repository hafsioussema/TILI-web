import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, FileImage, File, Upload, Download, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { UserRole, type TiliDocument, DocumentType } from '@/types/documents';
import { documentService } from './documentService';
import { cn } from '@/lib/utils';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { DocumentHistoryModal } from './components/DocumentHistoryModal';

const typeLabels: Record<DocumentType, string> = {
    [DocumentType.RAPPORT]: 'Rapports',
    [DocumentType.CR_REUNION]: 'Comptes rendus',
    [DocumentType.ADMINISTRATIF]: 'Administratifs',
    [DocumentType.PROJET]: 'Projets',
};

const typeIcons: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
    [DocumentType.RAPPORT]: FileText,
    [DocumentType.CR_REUNION]: FileSpreadsheet,
    [DocumentType.ADMINISTRATIF]: File,
    [DocumentType.PROJET]: FileImage,
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const DocumentsPage = () => {
    const { user } = useAuthStore();
    const [documents, setDocuments] = useState<TiliDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeType, setActiveType] = useState<DocumentType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocForHistory, setSelectedDocForHistory] = useState<TiliDocument | null>(null);

    const canUpload = user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;
    const canViewHistory = user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const docs = await documentService.getAll({
                type: activeType || undefined,
                search: searchQuery || undefined,
            });
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeType, searchQuery]);

    // Initial fetch
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDownload = async (doc: TiliDocument) => {
        const toastId = toast.loading(`Préparation du téléchargement de ${doc.name}...`);
        try {
            await documentService.download(doc._id, doc.name);
            toast.success('Téléchargement démarré', { id: toastId });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Erreur lors du téléchargement', { id: toastId });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Documents
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez et consultez tous les documents de vos projets
                    </p>
                </div>
                {canUpload && (
                    <PremiumButton onClick={() => setShowUploadModal(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Ajouter un document
                    </PremiumButton>
                )}
            </motion.div>

            {/* Search & Filters */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher un document..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>

                {/* Type Tabs */}
                <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border overflow-x-auto">
                    <button
                        onClick={() => setActiveType(null)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            !activeType
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                    >
                        Tous
                    </button>
                    {Object.entries(typeLabels).map(([type, label]) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type as DocumentType)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                activeType === type
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Document Grid */}
            <motion.div variants={item}>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <AnimatedCard>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Aucun document
                            </h3>
                            <p className="text-muted-foreground max-w-sm">
                                {activeType
                                    ? `Aucun document de type "${typeLabels[activeType]}" trouvé.`
                                    : "Commencez par ajouter votre premier document."}
                            </p>
                            {canUpload && (
                                <PremiumButton
                                    className="mt-6"
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Ajouter un document
                                </PremiumButton>
                            )}
                        </div>
                    </AnimatedCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {documents.map((doc) => {
                                const TypeIcon = typeIcons[doc.type];
                                return (
                                    <motion.div
                                        key={doc._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <AnimatedCard className="group relative h-full">
                                            <div className="p-4 flex flex-col h-full">
                                                {/* Type Badge */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <TypeIcon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                        {typeLabels[doc.type]}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                                    {doc.name}
                                                </h3>

                                                {/* Description */}
                                                {doc.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                                                        {doc.description}
                                                    </p>
                                                )}

                                                {/* Meta */}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                                                    <span>{formatFileSize(doc.size)}</span>
                                                    <span>v{doc.version}</span>
                                                    <span>{formatDate(doc.createdAt)}</span>
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-4 gap-2">
                                                    <button
                                                        onClick={() => handleDownload(doc)}
                                                        className="p-2 rounded-lg bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
                                                        title="Télécharger"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    {canViewHistory && (
                                                        <button
                                                            onClick={() => setSelectedDocForHistory(doc)}
                                                            className="p-2 rounded-lg bg-card border border-border text-foreground shadow-lg hover:scale-105 transition-transform"
                                                            title="Historique"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </AnimatedCard>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Upload Modal */}
            {showUploadModal && (
                <DocumentUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        fetchDocuments();
                    }}
                />
            )}

            {/* History Modal */}
            {selectedDocForHistory && (
                <DocumentHistoryModal
                    document={selectedDocForHistory}
                    onClose={() => setSelectedDocForHistory(null)}
                />
            )}
        </motion.div>
    );
};
