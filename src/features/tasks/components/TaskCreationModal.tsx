import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Calendar, AlignLeft, User, Flag } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { taskService, TaskStatus, TaskPriority } from "../taskService";
import { userService } from "@/features/users/userService";
import { type User as UserType } from "@/types";
import { toast } from "sonner";
import { useFocusTrap } from "@/lib/hooks/useKeyboardNavigation";

interface TaskCreationModalProps {
  projectId: string;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskCreationModal = ({
  projectId,
  initialStatus = TaskStatus.TODO,
  onClose,
  onSuccess,
}: TaskCreationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: initialStatus,
    priority: TaskPriority.MEDIUM,
    dueDate: "",
    assigneeId: "",
    projectId,
    tags: [] as string[],
  });

  // Implement focus trap for modal
  useFocusTrap(modalRef, true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await userService.getAll();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: '' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close modal with Escape key
    if (e.key === 'Escape') {
      onClose();
    }
    // Submit form with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      errors.title = "Le titre est requis";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsLoading(true);
    try {
      await taskService.create(formData);
      toast.success("Tâche créée");
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        aria-describedby="task-modal-description"
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <h2 id="task-modal-title" className="text-xl font-bold text-foreground">Nouvelle Tâche</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Fermer le modal (Échap)"
            title="Fermer (Échap)"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="task-creation-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
        >
          {Object.keys(validationErrors).length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              Veuillez corriger les erreurs du formulaire
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium text-muted-foreground ml-1">
              Titre de la tâche <span className="text-destructive" aria-label="requis">*</span>
            </label>
            <input
              id="task-title"
              name="title"
              autoFocus
              type="text"
              placeholder="ex: Design du header"
              className="w-full bg-secondary/50 border-border/50 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border"
              value={formData.title}
              onChange={handleChange}
              aria-required="true"
              aria-invalid={!!validationErrors.title}
              aria-describedby={validationErrors.title ? "title-error" : undefined}
            />
            {validationErrors.title && (
              <p id="title-error" className="text-xs text-destructive">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlignLeft className="mt-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <label htmlFor="task-description" className="text-sm font-medium">Description</label>
                <textarea
                  id="task-description"
                  name="description"
                  className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] border"
                  placeholder="Ajoutez des détails sur cette tâche..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 space-y-1">
                  <label htmlFor="task-priority" className="text-sm font-medium">Priorité</label>
                  <select
                    id="task-priority"
                    name="priority"
                    className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border cursor-pointer"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value={TaskPriority.LOW}>Basse</option>
                    <option value={TaskPriority.MEDIUM}>Moyenne</option>
                    <option value={TaskPriority.HIGH}>Haute</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 space-y-1">
                  <label htmlFor="task-duedate" className="text-sm font-medium">Échéance</label>
                  <input
                    id="task-duedate"
                    name="dueDate"
                    type="date"
                    className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border appearance-none cursor-pointer"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <label htmlFor="task-assignee" className="text-sm font-medium">Assigner à</label>
                <select
                  id="task-assignee"
                  name="assigneeId"
                  className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border cursor-pointer"
                  value={formData.assigneeId}
                  onChange={handleChange}
                >
                  <option value="">Non assigné</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.prenom} {u.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-border/50 bg-secondary/10 flex justify-end gap-3">
          <PremiumButton
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Annuler"
          >
            Annuler
          </PremiumButton>
          <PremiumButton 
            type="submit"
            form="task-creation-form"
            isLoading={isLoading}
            aria-label={isLoading ? "Création en cours..." : "Créer la tâche"}
          >
            Créer la tâche
          </PremiumButton>
        </div>
      </motion.div>
    </div>
  );
};
