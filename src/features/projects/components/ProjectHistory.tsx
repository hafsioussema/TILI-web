import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FolderPlus,
    FileText,
    CheckSquare,
    Loader2,
    Clock,
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { projectService, type ProjectHistoryItem } from '../projectService';
import { toast } from 'sonner';

interface ProjectHistoryProps {
    projectId: string;
}

const typeConfig = {
    project_created: {
        icon: FolderPlus,
        label: 'Projet créé',
        bg: 'bg-blue-500/10',
        color: 'text-blue-500',
        border: 'border-blue-500/30',
    },
    document_added: {
        icon: FileText,
        label: 'Document',
        bg: 'bg-purple-500/10',
        color: 'text-purple-500',
        border: 'border-purple-500/30',
    },
    task_created: {
        icon: CheckSquare,
        label: 'Tâche',
        bg: 'bg-emerald-500/10',
        color: 'text-emerald-500',
        border: 'border-emerald-500/30',
    },
} as const;

function formatDate(dateString: string): string {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
        return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7) {
        return d.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const ProjectHistory = ({ projectId }: ProjectHistoryProps) => {
    const [items, setItems] = useState<ProjectHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const data = await projectService.getHistory(projectId);
                setItems(data);
            } catch (error) {
                console.error('Failed to fetch project history:', error);
                toast.error('Erreur lors du chargement de l’historique');
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [projectId]);

    if (isLoading) {
        return (
            <AnimatedCard className="p-8">
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm">Chargement de l’historique...</span>
                </div>
            </AnimatedCard>
        );
    }

    if (items.length === 0) {
        return (
            <AnimatedCard className="p-8 border-2 border-dashed border-border">
                <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="h-14 w-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                        <Clock className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun historique</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Les événements du projet (création, documents ajoutés, tâches créées) apparaîtront ici.
                    </p>
                </div>
            </AnimatedCard>
        );
    }

    return (
        <AnimatedCard className="overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Activité du projet</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Chronologie des derniers événements
                </p>
            </div>
            <ul className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto list-none m-0 p-0" role="list">
                {items.map((item, index) => {
                    const config = typeConfig[item.type];
                    const Icon = config.icon;
                    return (
                        <li key={`${item.type}-${item.date}-${index}`} role="listitem">
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex gap-4 p-4 hover:bg-secondary/30 transition-colors w-full text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label={`${item.label} - ${formatDate(item.date)}${item.metadata?.userName ? ` par ${item.metadata.userName}` : ''}`}
                            >
                                <div
                                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${config.bg} ${config.color} ${config.border}`}
                                    aria-hidden="true"
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">
                                        {item.label}
                                    </p>
                                    {item.metadata?.userName && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            par {item.metadata.userName}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground/80 mt-1">
                                        {formatDate(item.date)}
                                    </p>
                                </div>
                            </motion.button>
                        </li>
                    );
                })}
            </ul>
        </AnimatedCard>
    );
};
