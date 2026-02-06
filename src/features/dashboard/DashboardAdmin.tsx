import { motion } from 'framer-motion';
import { StatsCards } from './components/StatsCards';
import { ActiveProjects } from './components/ActiveProjects';
import { RecentActivity } from './components/RecentActivity';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { format } from 'date-fns';

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

export const DashboardAdmin = () => {
    const user = useAuthStore((state) => state.user);

    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
                    Vue d'ensemble Administrateur
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Bienvenue, <span className="text-foreground font-medium">{user?.prenom}</span>. Vous avez le contrôle total du système.
                </p>
                <p className="text-sm text-muted-foreground/80 mt-1">
                    {format(new Date(), 'EEEE d MMMM yyyy')}
                </p>
            </motion.div>

            <motion.div variants={item}>
                <StatsCards />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={item} className="lg:col-span-2">
                    {/* Admin usually sees all projects or a global overview */}
                    <ActiveProjects />
                </motion.div>

                <motion.div variants={item} className="lg:col-span-1">
                    <RecentActivity />
                </motion.div>
            </div>
        </motion.div>
    );
};
