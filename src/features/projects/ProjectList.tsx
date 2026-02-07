import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Search } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ProjectCreationModal } from './components/ProjectCreationModal';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { projectService } from './projectService';
import { UserRole } from '@/types';
import { type Project, ProjectStatus } from '@/types/documents';
import { toast } from 'sonner';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFilters } from './components/ProjectFilters';

export const ProjectList = () => {
    const { user } = useAuthStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

    const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getAll();
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
                toast.error('Erreur lors du chargement des projets');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 h-full flex flex-col pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Projets</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos missions et suivez l'avancement de vos équipes.</p>
                </div>

                <div className="flex items-center gap-3">
                    {canCreate && (
                        <PremiumButton onClick={() => setShowCreateModal(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Projet
                        </PremiumButton>
                    )}
                </div>
            </div>

            {/* Controls like Team Members */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full bg-secondary/50 text-foreground pl-10 pr-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder-muted-foreground text-sm"
                        placeholder="Rechercher un projet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <ProjectFilters
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                />
            </div>

            {showCreateModal && (
                <ProjectCreationModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        window.location.reload();
                    }}
                />
            )}

            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border">
                        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
                        <p className="text-muted-foreground mb-6">Commencez par créer votre premier projet pour gérer vos tâches.</p>
                        {canCreate && (
                            <PremiumButton onClick={() => setShowCreateModal(true)}>
                                Créer un projet
                            </PremiumButton>
                        )}
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        <AnimatePresence>
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
