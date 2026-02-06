import { motion } from 'framer-motion';
import { StatsCards } from './components/StatsCards';
import { ActiveProjects } from './components/ActiveProjects';
import { RecentActivity } from './components/RecentActivity';
import { useAuthStore } from '@/features/auth/useAuthStore';

export const DashboardPM = () => {
    const { user } = useAuthStore();

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

    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
                        Welcome back, {user?.prenom || 'Project Manager'}
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </motion.div>

            <motion.div variants={item}>
                <StatsCards />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={item} className="lg:col-span-2">
                    <ActiveProjects />
                </motion.div>
                <motion.div variants={item} className="lg:col-span-1">
                    <RecentActivity />
                </motion.div>
            </div>
        </motion.div>
    );
};
