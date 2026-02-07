import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Briefcase, Calendar, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { userService } from "@/features/users/userService";
import { projectService } from "../projectService";
import { UserRole, type User } from "@/types";
import {
  type Project,
  type UpdateProjectDto,
  ProjectStatus,
} from "@/types/documents";

interface ProjectEditModalProps {
  project: Project;
  user: { id: string; role: UserRole; nom: string; prenom: string };
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

export const ProjectEditModal = ({
  project,
  user,
  onClose,
  onSuccess,
}: ProjectEditModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user.role === UserRole.ADMIN;
  const isChefProjet = user.role === UserRole.CHEF_PROJET;
  const canEdit = isAdmin || isChefProjet;

  // Get current member IDs
  const currentMemberIds =
    project.members?.map((member) =>
      typeof member === "object" && member?._id ? (member as any)._id : member,
    ) || [];

  const [formData, setFormData] = useState<UpdateProjectDto>({
    name: project.name,
    description: project.description || "",
    status: project.status,
    endDate: project.endDate
      ? new Date(project.endDate).toISOString().split("T")[0]
      : "",
    members: currentMemberIds,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await userService.getAll();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateDto: UpdateProjectDto = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        members: formData.members,
      };

      if (formData.endDate) {
        updateDto.endDate = formData.endDate;
      }

      const updatedProject = await projectService.update(
        project._id,
        updateDto,
      );
      toast.success("Projet mis à jour avec succès");
      onSuccess(updatedProject);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du projet");
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberToggle = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members?.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...(prev.members || []), userId],
    }));
  };

  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 text-center"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">
            Accès refusé
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas les permissions nécessaires pour modifier ce projet.
          </p>
          <PremiumButton onClick={onClose}>Fermer</PremiumButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase size={20} />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Modifier le Projet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Nom du projet
            </label>
            <input
              type="text"
              placeholder="ex: Refonte de la plateforme"
              className="w-full bg-secondary/50 border-border/50 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="flex items-start gap-3">
            <FileText className="mt-3 h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] border"
                placeholder="Décrivez l'objectif et la portée du projet..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                Statut
              </label>
              <select
                className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
              >
                <option value={ProjectStatus.ACTIVE}>Actif</option>
                <option value={ProjectStatus.COMPLETED}>Terminé</option>
                <option value={ProjectStatus.ARCHIVED}>Archivé</option>
              </select>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-3 h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Date de fin</label>
                <input
                  type="date"
                  className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <label className="text-sm font-medium">Membres de l'équipe</label>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-secondary/20 rounded-xl">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border focus:ring-primary/20"
                      checked={formData.members?.includes(u.id) || false}
                      onChange={() => handleMemberToggle(u.id)}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                        {u.prenom[0]}
                        {u.nom[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-border/50 bg-secondary/10 flex justify-end gap-3">
          <PremiumButton
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </PremiumButton>
          <PremiumButton
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!formData.name?.trim()}
          >
            Mettre à jour
          </PremiumButton>
        </div>
      </motion.div>
    </div>
  );
};
