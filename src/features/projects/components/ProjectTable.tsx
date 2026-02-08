import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Users as UsersIcon,
  MoreHorizontal,
  Layout,
  Info,
  Trash2,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Project, ProjectStatus } from "@/types/documents";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { projectService } from "../projectService";
import { ProjectEditModal } from "./ProjectEditModal";
import { toast } from "sonner";
import { UserRole, type User } from "@/types";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface ProjectTableProps {
  projects: Project[];
  user?: User | null;
  onDeleted?: (projectId: string) => void;
  onUpdated?: (updatedProject: Project) => void;
}

export const ProjectTable = ({
  projects,
  user,
  onDeleted,
  onUpdated,
}: ProjectTableProps) => {
  return (
    <>
      {/* Mobile: Card Grid View */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {projects.map((project) => (
            <ProjectCardMobile
              key={project._id}
              project={project}
              user={user}
              onDeleted={onDeleted}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Projet
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date de fin
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Progrès
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Équipe
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  user={user}
                  onDeleted={onDeleted}
                  onUpdated={onUpdated}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

interface ProjectRowProps {
  project: Project;
  user?: User | null;
  onDeleted?: (projectId: string) => void;
  onUpdated?: (updatedProject: Project) => void;
}

const ProjectRow = ({
  project,
  user,
  onDeleted,
  onUpdated,
}: ProjectRowProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  const managerId =
    typeof currentProject.managerId === "object" &&
    currentProject.managerId?._id
      ? currentProject.managerId._id
      : currentProject.managerId;
  const isManager =
    user?.id && managerId && String(managerId) === String(user.id);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isChefProjet = user?.role === UserRole.CHEF_PROJET;
  const canDelete = isAdmin || isManager;
  const canEdit = isAdmin || isChefProjet;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete || isDeleting) return;
    setIsMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    setIsMenuOpen(false);
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await projectService.delete(currentProject._id);
      setShowDeleteModal(false);
      onDeleted?.(currentProject._id);
    } catch (err) {
      console.error("Delete project failed", err);
      toast.error("Impossible de supprimer le projet");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
    setShowEditModal(false);
    onUpdated?.(updatedProject);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusConfig = {
    [ProjectStatus.ACTIVE]: {
      label: "Actif",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    [ProjectStatus.COMPLETED]: {
      label: "Terminé",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    [ProjectStatus.ARCHIVED]: {
      label: "Archivé",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
  };

  const currentStatus =
    statusConfig[currentProject.status] || statusConfig[ProjectStatus.ACTIVE];
  const progress = Math.min(
    100,
    Math.max(0, Number(currentProject.progress) ?? 0),
  );
  const membersList = Array.isArray(currentProject.members)
    ? currentProject.members
    : [];
  const hasManager = !!(
    currentProject.managerId != null && currentProject.managerId !== ""
  );
  const totalTeamSize = membersList.length + (hasManager ? 1 : 0);
  const displayMembers =
    hasManager &&
    typeof currentProject.managerId === "object" &&
    currentProject.managerId
      ? [currentProject.managerId, ...membersList]
      : membersList;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="group hover:bg-secondary/20 transition-colors cursor-pointer"
        onClick={() => navigate(`/projects/${currentProject._id}`)}
      >
        {/* Project Name */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shrink-0">
              <Briefcase size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {currentProject.name}
              </p>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
              currentStatus.className,
            )}
          >
            {currentStatus.label}
          </span>
        </td>

        {/* Description */}
        <td className="px-6 py-4 max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {currentProject.description || "Aucune description fournie."}
          </p>
        </td>

        {/* End Date */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} className="text-primary/60" />
            {formatDate(currentProject.endDate)}
          </div>
        </td>

        {/* Progress */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden min-w-[80px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  progress >= 100 ? "bg-emerald-500" : "bg-primary",
                )}
              />
            </div>
            <span className="text-sm font-semibold text-primary min-w-[40px] text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </td>

        {/* Team */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayMembers.slice(0, 3).map((member: any, i: number) => (
                <div
                  key={
                    typeof member === "object" && member?._id ? member._id : i
                  }
                  className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm overflow-hidden"
                  title={
                    typeof member === "string"
                      ? undefined
                      : `${member?.prenom ?? ""} ${member?.nom ?? ""}`.trim() ||
                        undefined
                  }
                >
                  {typeof member === "string"
                    ? "U"
                    : (member?.prenom?.[0] ?? member?.nom?.[0] ?? "U")}
                </div>
              ))}
              {displayMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  +{displayMembers.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              <UsersIcon size={14} />
              {totalTeamSize}
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 text-right">
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenu.Trigger asChild>
                <button
                  title="Menu"
                  aria-label="Ouvrir le menu"
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition outline-none"
                >
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="min-w-[180px] bg-popover rounded-lg shadow-xl p-1 border border-border z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                  <DropdownMenu.Item
                    onClick={() => navigate(`/projects/${currentProject._id}`)}
                    className="flex items-center px-3 py-2 text-sm text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                  >
                    <Layout size={16} className="mr-2" /> Voir Détails
                  </DropdownMenu.Item>
                  {canEdit && (
                    <DropdownMenu.Item
                      onClick={handleEditClick}
                      className="flex items-center px-3 py-2 text-sm text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                    >
                      <Edit3 size={16} className="mr-2" /> Modifier
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    onClick={() =>
                      navigate(`/projects/${currentProject._id}/settings`)
                    }
                    className="flex items-center px-3 py-2 text-sm text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                  >
                    <Info size={16} className="mr-2" /> Paramètres
                  </DropdownMenu.Item>
                  {canDelete && (
                    <DropdownMenu.Item
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="flex items-center px-3 py-2 text-sm text-destructive rounded hover:bg-destructive/10 cursor-pointer outline-none transition-colors"
                    >
                      <Trash2 size={16} className="mr-2" /> Supprimer
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </td>
      </motion.tr>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le projet"
        description={`Êtes-vous sûr de vouloir supprimer le projet "${currentProject.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />

      <AnimatePresence>
        {showEditModal && user && (
          <ProjectEditModal
            project={currentProject}
            user={user}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Mobile Card Component
interface ProjectCardMobileProps {
  project: Project;
  user?: User | null;
  onDeleted?: (projectId: string) => void;
  onUpdated?: (updatedProject: Project) => void;
}

const ProjectCardMobile = ({
  project,
  user,
  onDeleted,
  onUpdated,
}: ProjectCardMobileProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  const managerId =
    typeof currentProject.managerId === "object" &&
    currentProject.managerId?._id
      ? currentProject.managerId._id
      : currentProject.managerId;
  const isManager =
    user?.id && managerId && String(managerId) === String(user.id);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isChefProjet = user?.role === UserRole.CHEF_PROJET;
  const canDelete = isAdmin || isManager;
  const canEdit = isAdmin || isChefProjet;

  const handleDeleteClick = () => {
    if (!canDelete || isDeleting) return;
    setIsMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleEditClick = () => {
    if (!canEdit) return;
    setIsMenuOpen(false);
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await projectService.delete(currentProject._id);
      setShowDeleteModal(false);
      onDeleted?.(currentProject._id);
    } catch (err) {
      console.error("Delete project failed", err);
      toast.error("Impossible de supprimer le projet");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
    setShowEditModal(false);
    onUpdated?.(updatedProject);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusConfig = {
    [ProjectStatus.ACTIVE]: {
      label: "Actif",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    [ProjectStatus.COMPLETED]: {
      label: "Terminé",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    [ProjectStatus.ARCHIVED]: {
      label: "Archivé",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
  };

  const currentStatus =
    statusConfig[currentProject.status] || statusConfig[ProjectStatus.ACTIVE];
  const progress = Math.min(
    100,
    Math.max(0, Number(currentProject.progress) ?? 0),
  );
  const membersList = Array.isArray(currentProject.members)
    ? currentProject.members
    : [];
  const hasManager = !!(
    currentProject.managerId != null && currentProject.managerId !== ""
  );
  const totalTeamSize = membersList.length + (hasManager ? 1 : 0);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-lg p-4 hover:border-ring/50 transition-all cursor-pointer flex flex-col gap-3"
        onClick={() => navigate(`/projects/${currentProject._id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              {currentProject.name}
            </h3>
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mt-1",
                currentStatus.className,
              )}
            >
              {currentStatus.label}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1">
          {currentProject.description || "Aucune description"}
        </p>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {formatDate(currentProject.endDate)}
            </span>
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
          <span className="flex items-center gap-1">
            <UsersIcon size={10} /> {totalTeamSize}
          </span>
        </div>

        {/* Menu Dropdown */}
        <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <div className="sr-only">Menu</div>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="min-w-[160px] bg-popover rounded-lg shadow-xl p-1 border border-border z-50"
            >
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${currentProject._id}`);
                }}
                className="flex items-center px-3 py-2 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
              >
                <Layout size={12} className="mr-2" /> Détails
              </DropdownMenu.Item>
              {canEdit && (
                <DropdownMenu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  className="flex items-center px-3 py-2 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                >
                  <Edit3 size={12} className="mr-2" /> Modifier
                </DropdownMenu.Item>
              )}
              {canDelete && (
                <DropdownMenu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  disabled={isDeleting}
                  className="flex items-center px-3 py-2 text-xs text-destructive rounded hover:bg-destructive/10 cursor-pointer outline-none transition-colors"
                >
                  <Trash2 size={12} className="mr-2" /> Supprimer
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </motion.div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le projet"
        description={`Êtes-vous sûr de vouloir supprimer le projet "${currentProject.name}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />

      <AnimatePresence>
        {showEditModal && user && (
          <ProjectEditModal
            project={currentProject}
            user={user}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};
