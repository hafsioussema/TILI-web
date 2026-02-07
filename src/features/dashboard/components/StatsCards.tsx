import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Briefcase, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../dashboardService';

interface StatsCardsProps {
    stats?: DashboardStats;
    isLoading?: boolean;
    /** Average project progress 0–100 for "Taux de Progression" card */
    averageProgress?: number;
}

const clampProgress = (p: unknown): number =>
    Math.min(100, Math.max(0, Number(p) ?? 0));

export const StatsCards = ({ stats, isLoading, averageProgress }: StatsCardsProps) => {
    const progressValue = averageProgress !== undefined ? clampProgress(averageProgress) : null;
    const items = [
        {
            label: "Projets Actifs",
            value: stats?.projects.active ?? 0,
            icon: Briefcase,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "En cours",
            isPercent: false
        },
        {
            label: "Total Documents",
            value: stats?.documents.total ?? 0,
            icon: FileText,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            trend: "Partage de fichiers",
            isPercent: false
        },
        {
            label: "Projets Clôturés",
            value: stats?.projects.closed ?? 0,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10",
            trend: "Terminés",
            isPercent: false
        },
        {
            label: "Taux de Progression",
            value: progressValue,
            icon: TrendingUp,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            trend: "Moyenne des projets",
            isPercent: true
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((stat, index) => (
                <AnimatedCard key={index} className="flex flex-col justify-between">
                    {isLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="h-4 bg-secondary rounded w-20" />
                                    <div className="h-8 bg-secondary rounded w-16" />
                                </div>
                                <div className="h-10 w-10 bg-secondary rounded-lg" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <h3 className="text-2xl font-bold mt-1 text-foreground">
                                        {stat.isPercent
                                            ? (stat.value !== null ? `${Math.round(Number(stat.value))}%` : '—')
                                            : stat.value}
                                    </h3>
                                </div>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-muted-foreground">
                                <span className="text-green-500 font-medium mr-1">{stat.trend}</span>
                            </div>
                        </>
                    )}
                </AnimatedCard>
            ))}
        </div>
    );
};
