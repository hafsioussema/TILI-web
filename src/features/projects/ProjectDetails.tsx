import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanBoard } from "./components/KanbanBoard";
import {
  Calendar,
  Users as UsersIcon,
  Layout,
  CheckCircle2,
  Trash2,
  Edit3,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ProjectEditModal } from "./components/ProjectEditModal";
import { ProjectMembersManager } from "./components/ProjectMembersManager";
import { projectService } from "./projectService";
import { ProjectDocuments } from "@/features/documents/components/ProjectDocuments";
import { ProjectHistory } from "./components/ProjectHistory";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { type Project, ProjectStatus } from "@/types/documents";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProjectChatPanel, ChatButton } from "@/components/messages";
import { useTranslation } from 'react-i18next';

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "documents" | "history">(
    "tasks",
  );
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation('common');

  const managerId =
    typeof project?.managerId === "object" && project?.managerId?._id
      ? (project.managerId as any)._id
      : project?.managerId;
  const isManager =
    user?.id && managerId && String(managerId) === String(user.id);
  const canEditProject =
    user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;
  const canManageMembers =
    user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;
  const canDeleteProject = user?.role === UserRole.ADMIN || isManager;
  const canCloseProject =
    (user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET) &&
    project?.status === ProjectStatus.ACTIVE;

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const data = await projectService.getById(id);
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error(t('projects.detailsLoadError'));
        navigate("/projects");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate, t]);

  // Set page title
  usePageTitle(
    project
      ? t('projects.detailsTitle', { name: project.name })
      : t('projects.detailsFallback')
  );

  const breadcrumbItems = project
    ? [
        { label: t('breadcrumbs.home'), href: "/" },
        { label: t('breadcrumbs.projects'), href: "/projects" },
        { label: project.name },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 h-full flex flex-col pb-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
                {project.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Chat Button */}
            {id && <ChatButton projectId={id} />}
            
            {canEditProject && (
              <PremiumButton
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" /> {t('projects.edit')}
              </PremiumButton>
            )}
            {canCloseProject && (
              <PremiumButton
                variant="outline"
                onClick={() => setShowCloseModal(true)}
                disabled={isClosing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> {t('projects.close')}
              </PremiumButton>
            )}
            {canDeleteProject && (
              <PremiumButton
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Trash2 className="mr-2 h-4 w-4" /> {t('projects.delete')}
              </PremiumButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.deadline')}</p>
              <p className="text-sm font-semibold">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : t('projects.deadlineUnset')}
              </p>
            </div>
          </AnimatedCard>
          <AnimatedCard
            className={`p-4 flex items-center gap-4 ${canManageMembers ? "cursor-pointer hover:bg-secondary/40 transition-colors" : ""}`}
            onClick={
              canManageMembers ? () => setShowMembersModal(true) : undefined
            }
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <UsersIcon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t('projects.team')}</p>
              <p className="text-sm font-semibold">
                {t('projects.memberCount', { count: (project as any).members?.length || 0 })}
              </p>
              {canManageMembers && (
                <p className="text-xs text-primary opacity-80">
                  {t('projects.manageMembers')}
                </p>
              )}
            </div>
            {canManageMembers && (
              <UsersIcon size={16} className="text-muted-foreground/50" />
            )}
          </AnimatedCard>
          <AnimatedCard className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Layout size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{t('projects.progress')}</p>
              <p className="text-sm font-semibold">
                {Math.round(
                  Math.min(100, Math.max(0, Number(project.progress) ?? 0)),
                )}
                %
              </p>
              <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(project.progress) ?? 0))}%`,
                  }}
                />
              </div>
            </div>
          </AnimatedCard>
        </div>

        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === "tasks" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t('projects.tabs.tasks')}
            {activeTab === "tasks" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === "documents" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t('projects.tabs.documents')}
            {activeTab === "documents" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === "history" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t('projects.tabs.history')}
            {activeTab === "history" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <KanbanBoard projectId={project._id} />
            </motion.div>
          )}
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProjectDocuments projectId={project._id} />
            </motion.div>
          )}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProjectHistory projectId={project._id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={async () => {
          if (!id) return;
          setIsClosing(true);
          try {
            const updated = await projectService.close(id);
            setProject(updated);
            setShowCloseModal(false);
            toast.success(
              t('projects.closeSuccess')
            );
          } catch {
            toast.error(t('projects.closeError'));
          } finally {
            setIsClosing(false);
          }
        }}
        title={t('projects.closeTitle')}
        description={t('projects.closeDesc')}
        confirmLabel={t('projects.closeConfirm')}
        cancelLabel={t('common.cancel')}
        variant="warning"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (!id) return;
          setIsDeleting(true);
          try {
            await projectService.delete(id);
            toast.success(t('projects.deleteSuccess'));
            navigate("/projects");
          } catch {
            toast.error(t('projects.deleteError'));
          } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
          }
        }}
        title={t('projects.deleteTitle')}
        description={t('projects.deleteDesc')}
        confirmLabel={t('projects.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />

      <AnimatePresence>
        {showEditModal && user && (
          <ProjectEditModal
            project={project}
            user={user}
            onClose={() => setShowEditModal(false)}
            onSuccess={(updatedProject) => {
              setProject(updatedProject);
              setShowEditModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMembersModal && user && (
          <ProjectMembersManager
            project={project}
            user={user}
            onClose={() => setShowMembersModal(false)}
            onSuccess={(updatedProject) => {
              setProject(updatedProject);
              setShowMembersModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Project Chat Panel */}
      {id && (
        <ProjectChatPanel
          projectId={id}
          projectName={project.name}
          members={(project as any).members?.map((m: any) => ({
            _id: m._id,
            nom: m.nom,
            prenom: m.prenom,
            avatar: m.avatar,
          })) || []}
        />
      )}
    </div>
  );
};
