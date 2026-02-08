import { useState, useEffect } from "react";
import { Plus, Briefcase, Search } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ProjectCreationModal } from "./components/ProjectCreationModal";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { projectService } from "./projectService";
import { UserRole } from "@/types";
import { type Project, ProjectStatus } from "@/types/documents";
import { toast } from "sonner";
import { ProjectTable } from "./components/ProjectTable";
import { ProjectFilters } from "./components/ProjectFilters";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export const ProjectList = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('common');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>(
    "all",
  );

  // Set page title
  usePageTitle(t('projects.pageTitle'));
  
  // Announce loading state
  useEffect(() => {
    const announcer = document.getElementById('loading-announcer');
    if (announcer) {
      if (isLoading) {
        announcer.textContent = t('projects.loading');
      } else {
        announcer.textContent = t('projects.loaded', { count: projects.length });
        setTimeout(() => { announcer.textContent = ''; }, 1000);
      }
    }
  }, [isLoading, projects.length]);

  const canCreate =
    user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error(t('projects.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [t]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
            {t('projects.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('projects.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <PremiumButton onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('projects.newProject')}
            </PremiumButton>
          )}
        </div>
      </div>

      {/* Controls like Team Members */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <label htmlFor="project-search" className="sr-only">
            {t('projects.searchLabel')}
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" aria-hidden="true" />
          </div>
          <input
            id="project-search"
            type="search"
            className="block w-full bg-secondary/50 text-foreground pl-10 pr-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder-muted-foreground text-sm"
            placeholder={t('projects.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('projects.searchAria')}
          />
        </div>

        <ProjectFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {showCreateModal && user && (
        <ProjectCreationModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('projects.emptyTitle')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('projects.emptyDesc')}
            </p>
            {canCreate && (
              <PremiumButton onClick={() => setShowCreateModal(true)}>
                {t('projects.createFirst')}
              </PremiumButton>
            )}
          </div>
        ) : (
          <ProjectTable
            projects={filteredProjects}
            user={user}
            onDeleted={(projectId) => {
              setProjects((prev) => prev.filter((p) => p._id !== projectId));
            }}
            onUpdated={(updatedProject) => {
              setProjects((prev) =>
                prev.map((p) =>
                  p._id === updatedProject._id ? updatedProject : p,
                ),
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
