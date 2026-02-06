import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, RefreshCw, Trash2, User } from 'lucide-react';
import { type TiliDocument, type DocumentHistory, DocumentAction, type DocumentUser } from '@/types/documents';
import { documentService } from '../documentService';
import { cn } from '@/lib/utils';

interface DocumentHistoryModalProps {
    document: TiliDocument;
    onClose: () => void;
}

const actionLabels: Record<DocumentAction, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    [DocumentAction.UPLOAD]: { label: 'Upload', icon: Upload, color: 'text-green-500 bg-green-500/10' },
    [DocumentAction.UPDATE]: { label: 'Mise à jour', icon: RefreshCw, color: 'text-blue-500 bg-blue-500/10' },
    [DocumentAction.DOWNLOAD]: { label: 'Téléchargement', icon: Download, color: 'text-purple-500 bg-purple-500/10' },
    [DocumentAction.DELETE]: { label: 'Suppression', icon: Trash2, color: 'text-red-500 bg-red-500/10' },
};

export const DocumentHistoryModal = ({ document, onClose }: DocumentHistoryModalProps) => {
    const [history, setHistory] = useState<DocumentHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await documentService.getHistory(document._id);
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [document._id]);

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getUserName = (user: string | DocumentUser): string => {
        if (typeof user === 'string') return 'Utilisateur';
        return `${user.prenom} ${user.nom}`;
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
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Historique
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[280px]">
                            {document.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="p-6 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-10 w-10 rounded-xl bg-secondary" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-secondary rounded w-2/3" />
                                        <div className="h-3 bg-secondary rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Aucun historique disponible</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                            <div className="space-y-6">
                                {history.map((item, index) => {
                                    const actionConfig = actionLabels[item.action];
                                    const ActionIcon = actionConfig.icon;

                                    return (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative flex gap-4 pl-2"
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                "relative z-10 h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                                actionConfig.color
                                            )}>
                                                <ActionIcon className="h-5 w-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">
                                                        {actionConfig.label}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                                        v{item.version}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{getUserName(item.userId)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
