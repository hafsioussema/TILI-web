import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { StatsCards } from './components/StatsCards';
import { ActiveProjects } from './components/ActiveProjects';
import { RecentActivity } from './components/RecentActivity';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { format } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import { dashboardService, type DashboardStats, type GlobalActivity } from './dashboardService';
import { projectService } from '@/features/projects/projectService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const DashboardConsultant = () => {
    const { user } = useAuthStore();
    const { t, i18n } = useTranslation('common');
    const [stats, setStats] = useState<DashboardStats>();
    const [activities, setActivities] = useState<GlobalActivity[]>([]);
    const [averageProgress, setAverageProgress] = useState<number | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsData, activityData, projectsData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getActivity(6),
                projectService.getAll().catch(() => [])
            ]);
            setStats(statsData);
            setActivities(activityData);
            const total = projectsData.length;
            const avg = total > 0
                ? projectsData.reduce((sum, p) => sum + Math.min(100, Math.max(0, Number(p.progress) ?? 0)), 0) / total
                : undefined;
            setAverageProgress(avg);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error(t('dashboard.consultantLoadError'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <motion.div
            className="space-y-8 pb-10"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item}>
                <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
                    {t('dashboard.consultantTitle')}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {t('dashboard.consultantSubtitle', { name: user?.prenom || '' })}
                </p>
                <p className="text-sm text-muted-foreground/80 mt-1 capitalize">
                    {format(new Date(), 'EEEE d MMMM yyyy', {
                        locale: i18n.resolvedLanguage?.startsWith('fr')
                            ? fr
                            : i18n.resolvedLanguage?.startsWith('ar') || i18n.resolvedLanguage?.startsWith('tn')
                                ? arSA
                                : enUS
                    })}
                </p>
            </motion.div>

            <motion.div variants={item}>
                <StatsCards stats={stats} isLoading={isLoading} averageProgress={averageProgress} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                <motion.div variants={item} className="md:col-span-2 lg:col-span-2">
                    <ActiveProjects />
                </motion.div>
                <motion.div variants={item} className="md:col-span-2 lg:col-span-1">
                    <RecentActivity activities={activities} isLoading={isLoading} />
                </motion.div>
            </div>
        </motion.div>
    );
};
