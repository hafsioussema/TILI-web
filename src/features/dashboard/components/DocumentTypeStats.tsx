import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { DocumentType } from '@/types/documents';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DocumentTypeStatsProps {
    stats: Record<DocumentType, number>;
}

const typeConfig: Record<DocumentType, { label: string; icon: any; color: string; bg: string }> = {
    [DocumentType.RAPPORT]: { label: 'Rapports', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    [DocumentType.CR_REUNION]: { label: 'Comptes Rendus', icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10' },
    [DocumentType.ADMINISTRATIF]: { label: 'Administratifs', icon: File, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    [DocumentType.PROJET]: { label: 'Projets', icon: FileImage, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

export const DocumentTypeStats = ({ stats }: DocumentTypeStatsProps) => {
    const { t } = useTranslation('common');
    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    return (
        <AnimatedCard className="h-full">
            <h2 className="text-lg font-semibold text-foreground mb-6">Distribution des Documents</h2>

            <div className="space-y-5">
                {Object.entries(typeConfig).map(([type, config]) => {
                    const count = Number(stats[type as DocumentType]) || 0;
                    const percentage = total > 0 ? Math.min(100, (count / total) * 100) : 0;
                    const Icon = config.icon;
                    const isFull = percentage >= 99.5;
                    const barBgClass = isFull ? 'bg-emerald-500' : config.color.replace('text-', 'bg-');

                    return (
                        <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-1.5 rounded-lg", config.bg)}>
                                        <Icon className={cn("h-4 w-4", config.color)} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {count} ({Math.round(percentage)}%)
                                </span>
                            </div>

                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={cn("h-full rounded-full min-w-0", barBgClass)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {total === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">{t('components.documentStats.noDocuments')}</p>
                </div>
            )}
        </AnimatedCard>
    );
};
