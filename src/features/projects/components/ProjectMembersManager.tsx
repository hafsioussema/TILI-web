import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Search,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { userService } from "@/features/users/userService";
import { projectService } from "../projectService";
import { UserRole, type User } from "@/types";
import { type Project, type UpdateProjectDto } from "@/types/documents";

interface ProjectMembersManagerProps {
  project: Project;
  user: { id: string; role: UserRole; nom: string; prenom: string };
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

export const ProjectMembersManager = ({
  project,
  user,
  onClose,
  onSuccess,
}: ProjectMembersManagerProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const isChefProjet = user.role === UserRole.CHEF_PROJET;
  const canManageMembers = isAdmin || isChefProjet;
  const canChangeManager = isAdmin;

  // Get current manager and member data
  const currentManager =
    typeof project.managerId === "object" && project.managerId
      ? (project.managerId as any)
      : null;
  const currentManagerId = currentManager?._id || project.managerId;

  const currentMembers =
    project.members
      ?.map((member) =>
        typeof member === "object" && member ? (member as any) : null,
      )
      .filter(Boolean) || [];

  const currentMemberIds = currentMembers.map((m) => m._id || m);

  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    currentManagerId || "",
  );
  const [selectedMemberIds, setSelectedMemberIds] =
    useState<string[]>(currentMemberIds);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.getAll();
        setAllUsers(users.filter((u) => u.isActive));
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!canManageMembers) return;

    setIsSubmitting(true);
    try {
      const updateDto: UpdateProjectDto = {
        members: selectedMemberIds,
      };

      // Only admins can change the manager
      if (canChangeManager && selectedManagerId !== currentManagerId) {
        (updateDto as any).managerId = selectedManagerId;
      }

      const updatedProject = await projectService.update(
        project._id,
        updateDto,
      );
      toast.success("Équipe mise à jour avec succès");
      onSuccess(updatedProject);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'équipe");
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const removeMember = (userId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== userId));
  };

  const availableUsers = allUsers.filter(
    (u) =>
      !selectedMemberIds.includes(u.id) &&
      u.id !== selectedManagerId &&
      (u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const selectedMembers = allUsers.filter((u) =>
    selectedMemberIds.includes(u.id),
  );
  const selectedManager = allUsers.find((u) => u.id === selectedManagerId);

  const hasChanges =
    selectedMemberIds.length !== currentMemberIds.length ||
    !selectedMemberIds.every((id) => currentMemberIds.includes(id)) ||
    (canChangeManager && selectedManagerId !== currentManagerId);

  // Read-only view for consultants
  if (!canManageMembers) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Équipe du Projet
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Chef de Projet */}
            {currentManager && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Chef de Projet
                </h3>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-sm font-bold text-primary">
                        {currentManager.prenom[0]}
                        {currentManager.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {currentManager.prenom} {currentManager.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentManager.email}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                        {currentManager.role?.toLowerCase() || "chef de projet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Membres */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Membres de l'équipe ({currentMembers.length})
              </h3>
              <div className="space-y-2">
                {currentMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {member.prenom[0]}
                      {member.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.prenom} {member.nom}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                        {member.role?.toLowerCase() || "membre"}
                      </span>
                    </div>
                  </div>
                ))}
                {currentMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun membre assigné</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/50 bg-secondary/10 flex justify-end">
            <PremiumButton onClick={onClose}>Fermer</PremiumButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // Editable view for admins and project managers
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Gestion de l'Équipe
              </h2>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chef de Projet Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Chef de Projet
                {canChangeManager && (
                  <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium">
                    Modifiable
                  </span>
                )}
              </h3>

              {/* Chef Actuel */}
              {currentManager ? (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-sm font-bold text-primary">
                        {currentManager.prenom[0]}
                        {currentManager.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {currentManager.prenom} {currentManager.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentManager.email}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                        {currentManager.role?.toLowerCase() || "chef de projet"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-600">
                      Aucun chef assigné
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sélectionnez un chef ci-dessous
                    </p>
                  </div>
                </div>
              )}

              {/* Changement de Chef (Admin uniquement) */}
              {canChangeManager && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Nouveau chef de projet
                  </label>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <select
                      className="w-full bg-background border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border text-sm"
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                    >
                      <option value="">Conserver le chef actuel</option>
                      {allUsers
                        .filter(
                          (u) =>
                            (u.role === UserRole.CHEF_PROJET ||
                              u.role === UserRole.ADMIN) &&
                            u.id !== currentManagerId,
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.prenom} {u.nom} (
                            {u.role === UserRole.ADMIN
                              ? "Admin"
                              : "Chef de Projet"}
                            )
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Membres Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Membres de l'équipe ({selectedMembers.length})
                </h3>
                <PremiumButton
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddMembers(!showAddMembers)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {showAddMembers ? "Fermer" : "Ajouter"}
                </PremiumButton>
              </div>

              {/* Liste des membres sélectionnés */}
              <div className="space-y-2 max-h-64 overflow-y-auto bg-secondary/10 rounded-xl p-3">
                <AnimatePresence>
                  {selectedMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-3 bg-background rounded-lg group hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {member.prenom[0]}
                          {member.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {member.prenom} {member.nom}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {member.role.toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Retirer du projet"
                      >
                        <UserMinus size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {selectedMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun membre assigné</p>
                    <p className="text-xs mt-1">
                      Cliquez sur "Ajouter" pour inviter des membres
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Ajout de Membres */}
          <AnimatePresence>
            {showAddMembers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <UserPlus className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Ajouter des membres
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Cliquez sur les utilisateurs à ajouter au projet
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    className="w-full bg-secondary/30 border-border/50 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 bg-secondary/10 rounded-xl p-3">
                    {availableUsers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">
                          {searchTerm
                            ? "Aucun utilisateur trouvé"
                            : "Tous les utilisateurs sont déjà assignés"}
                        </p>
                      </div>
                    ) : (
                      availableUsers.map((u) => (
                        <motion.div
                          key={u.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors cursor-pointer group"
                          onClick={() => toggleMember(u.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {u.prenom[0]}
                              {u.nom[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {u.prenom} {u.nom}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.email}
                              </p>
                              <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                                {u.role.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-background group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                            <UserPlus size={14} className="text-emerald-500" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Résumé des changements */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl"
              >
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  Modifications en attente
                </h4>
                <div className="space-y-2 text-xs">
                  {canChangeManager &&
                    selectedManagerId !== currentManagerId && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Crown className="h-3 w-3 text-primary" />
                        <span>Nouveau chef: </span>
                        <span className="font-medium text-foreground">
                          {selectedManager
                            ? `${selectedManager.prenom} ${selectedManager.nom}`
                            : "Non défini"}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3 w-3 text-primary" />
                    <span>Membres: </span>
                    <span className="font-medium text-foreground">
                      {selectedMemberIds.length}
                    </span>
                    {selectedMemberIds.length !== currentMemberIds.length && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          selectedMemberIds.length > currentMemberIds.length
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {selectedMemberIds.length > currentMemberIds.length
                          ? "+"
                          : ""}
                        {selectedMemberIds.length - currentMemberIds.length}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-border/50 bg-secondary/10">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-primary" />
                  <span>Admin: Gestion complète (chef + membres)</span>
                </div>
              )}
              {isChefProjet && !isAdmin && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" />
                  <span>Chef de projet: Gestion des membres uniquement</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
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
                disabled={!hasChanges}
              >
                <Check className="mr-2 h-4 w-4" />
                Sauvegarder (
                {hasChanges ? "avec changements" : "pas de changements"})
              </PremiumButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
