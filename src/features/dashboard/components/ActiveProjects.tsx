import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ArrowRight, MoreHorizontal, Briefcase } from 'lucide-react';
import { projectService } from '@/features/projects/projectService';
import { ProjectStatus, type Project } from '@/types/documents';
import { toast } from 'sonner';

export const ActiveProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getAll({ status: ProjectStatus.ACTIVE });
                setProjects(data.slice(0, 5)); // Show only top 5 in dashboard
            } catch (error) {
                console.error('Failed to fetch projects:', error);
                toast.error('Erreur lors du chargement des projets');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <AnimatedCard className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Projets Actifs</h2>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? 'Chargement...' : `Vous avez ${projects.length} projets en cours`}
                    </p>
                </div>
                <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/projects')}
                >
                    Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
                    ))
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Aucun projet actif pour le moment</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer"
                        >
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center justify-between p-0 mb-2">
                                    <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                        {project.name}
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground">
                                        Fin: {formatDate(project.endDate)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-0">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min(100, Math.max(0, Number(project.progress) ?? 0))}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold w-8 text-right shrink-0">
                                        {Math.round(Math.min(100, Math.max(0, Number(project.progress) ?? 0)))}%
                                    </span>
                                </div>
                            </div>

                            <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </AnimatedCard>
    );
};
