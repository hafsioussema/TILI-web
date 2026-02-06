import { motion } from 'framer-motion';
import { ActiveProjects } from './components/ActiveProjects';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

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
    const user = useAuthStore((state) => state.user);

    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Mes Projets
                </h1>
                <p className="text-muted-foreground mt-1">
                    Bienvenue, {user?.prenom}. Voici un aperçu de vos missions en cours.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={item} className="lg:col-span-2">
                    {/* Consultant only sees projects they are assigned to */}
                    <ActiveProjects />
                </motion.div>

                <motion.div variants={item} className="lg:col-span-1">
                    <AnimatedCard>
                        <div className="p-4">
                            <h3 className="font-semibold mb-2">Instructions</h3>
                            <p className="text-sm text-muted-foreground">
                                En tant que consultant, vous avez accès aux documents et réunions liés à vos projets.
                                Veuillez consulter la section "Documents" pour les derniers fichiers.
                            </p>
                        </div>
                    </AnimatedCard>
                </motion.div>
            </div>
        </motion.div>
    );
};
