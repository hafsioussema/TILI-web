import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, Users as UsersIcon, MoreHorizontal, Layout, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Project, ProjectStatus } from '@/types/documents';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';
import { projectService } from '../projectService';
import { toast } from 'sonner';
import { UserRole, type User } from '@/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ProjectCardProps {
    project: Project;
    user?: User | null;
    onDeleted?: () => void;
}

export const ProjectCard = ({ project, user, onDeleted }: ProjectCardProps) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const managerId = typeof project.managerId === 'object' && project.managerId?._id
        ? project.managerId._id
        : project.managerId;
    const isManager = user?.id && managerId && String(managerId) === String(user.id);
    const isAdmin = user?.role === UserRole.ADMIN;
    const canDelete = isAdmin || isManager;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canDelete || isDeleting) return;
        setIsMenuOpen(false);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await projectService.delete(project._id);
            setShowDeleteModal(false);
            onDeleted?.();
        } catch (err) {
            console.error('Delete project failed', err);
            toast.error('Impossible de supprimer le projet');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const statusConfig = {
        [ProjectStatus.ACTIVE]: {
            label: 'Actif',
            className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        },
        [ProjectStatus.COMPLETED]: {
            label: 'Terminé',
            className: "bg-blue-500/10 text-blue-500 border-blue-500/20"
        },
        [ProjectStatus.ARCHIVED]: {
            label: 'Archivé',
            className: "bg-amber-500/10 text-amber-500 border-amber-500/20"
        }
    };

    const currentStatus = statusConfig[project.status] || statusConfig[ProjectStatus.ACTIVE];
    const progress = Math.min(100, Math.max(0, Number(project.progress) ?? 0));
    const membersList = Array.isArray(project.members) ? project.members : [];
    const hasManager = !!(project.managerId != null && project.managerId !== '');
    const totalTeamSize = membersList.length + (hasManager ? 1 : 0);
    const displayMembers = hasManager && typeof project.managerId === 'object' && project.managerId
        ? [project.managerId, ...membersList]
        : membersList;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-card border border-border hover:border-ring/50 rounded-xl p-5 hover:bg-secondary/20 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full"
            onClick={() => navigate(`/projects/${project._id}`)}
        >
            <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenu.Trigger asChild>
                        <button
                            title="Menu"
                            aria-label="Ouvrir le menu"
                            className={cn(
                                "p-1.5 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition outline-none opacity-0 group-hover:opacity-100",
                                isMenuOpen && "opacity-100"
                            )}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="min-w-[160px] bg-popover rounded-lg shadow-xl p-1 border border-border z-50 animate-in fade-in zoom-in-95 duration-200">
                            <DropdownMenu.Item
                                onClick={() => navigate(`/projects/${project._id}`)}
                                className="flex items-center px-2 py-1.5 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                            >
                                <Layout size={12} className="mr-2" /> Voir Détails
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                onClick={() => navigate(`/projects/${project._id}/settings`)}
                                className="flex items-center px-2 py-1.5 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                            >
                                <Info size={12} className="mr-2" /> Paramètres
                            </DropdownMenu.Item>
                            {canDelete && (
                                <DropdownMenu.Item
                                    onClick={handleDeleteClick}
                                    disabled={isDeleting}
                                    className="flex items-center px-2 py-1.5 text-xs text-destructive rounded hover:bg-destructive/10 cursor-pointer outline-none transition-colors"
                                >
                                    <Trash2 size={12} className="mr-2" /> Supprimer
                                </DropdownMenu.Item>
                            )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

            <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 transition-transform group-hover:scale-105 shrink-0">
                    <Briefcase size={24} />
                </div>
                <div className="overflow-hidden pr-8">
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            currentStatus.className
                        )}>
                            {currentStatus.label}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {project.description || 'Aucune description fournie.'}
                </p>
            </div>

            <div className="space-y-4 mt-auto">
                <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Calendar size={12} className="text-primary/60" />
                        {formatDate(project.endDate)}
                    </div>
                    <span className="font-bold text-primary">{Math.round(progress)}%</span>
                </div>

                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full min-w-0 transition-all duration-300",
                            progress >= 100 ? "bg-emerald-500" : "bg-primary"
                        )}
                    />
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {displayMembers.slice(0, 3).map((member: any, i: number) => (
                            <div
                                key={typeof member === 'object' && member?._id ? member._id : i}
                                className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm overflow-hidden"
                                title={typeof member === 'string' ? undefined : `${member?.prenom ?? ''} ${member?.nom ?? ''}`.trim() || undefined}
                            >
                                {typeof member === 'string' ? 'U' : (member?.prenom?.[0] ?? member?.nom?.[0] ?? 'U')}
                            </div>
                        ))}
                        {displayMembers.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                +{displayMembers.length - 3}
                            </div>
                        )}
                    </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70">
                        <UsersIcon size={12} />
                        {totalTeamSize}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Supprimer le projet"
                description={`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action est irréversible.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
            />
        </motion.div>
    );
};
