import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, FileImage, File, User, Clock } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { DocumentType } from '@/types/documents';
import { type GlobalActivity } from '../dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
    activities: GlobalActivity[];
    isLoading?: boolean;
}

const typeIcons: Record<DocumentType, any> = {
    [DocumentType.RAPPORT]: FileText,
    [DocumentType.CR_REUNION]: FileSpreadsheet,
    [DocumentType.ADMINISTRATIF]: File,
    [DocumentType.PROJET]: FileImage,
};

export const RecentActivity = ({ activities, isLoading }: RecentActivityProps) => {
    return (
        <AnimatedCard className="h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Activités Récentes</h2>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-border/50">
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 items-start relative animate-pulse">
                            <div className="h-6 w-6 rounded-full bg-secondary z-10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-secondary rounded w-3/4" />
                                <div className="h-3 bg-secondary rounded w-1/4" />
                            </div>
                        </div>
                    ))
                ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                    </div>
                ) : (
                    activities.map((activity, i) => {
                        const Icon = activity.documentId ? typeIcons[activity.documentId.type] : User;
                        return (
                            <motion.div
                                key={activity._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex gap-4 items-start relative"
                            >
                                <div className={cn(
                                    "h-[22px] w-[22px] rounded-full flex items-center justify-center z-10 ring-4 ring-card",
                                    activity.action === 'UPLOAD' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                                )}>
                                    <Icon className="h-3 w-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground leading-snug">
                                        <span className="font-semibold">{activity.userId?.prenom} {activity.userId?.nom}</span>
                                        {' '}
                                        <span className="text-muted-foreground">
                                            {activity.action === 'UPLOAD' ? 'a ajouté' :
                                                activity.action === 'DOWNLOAD' ? 'a téléchargé' :
                                                    activity.action === 'UPDATE' ? 'a mis à jour' : 'a modifié'}
                                        </span>
                                        {' '}
                                        <span className="font-medium text-primary hover:underline cursor-pointer truncate inline-block max-w-[150px] align-bottom">
                                            {activity.documentId?.name}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: fr })}
                                        </p>
                                        {activity.documentId?.projectId && (
                                            <>
                                                <span className="text-muted-foreground/30">•</span>
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                                    {activity.documentId.projectId.name}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </AnimatedCard>
    );
};
