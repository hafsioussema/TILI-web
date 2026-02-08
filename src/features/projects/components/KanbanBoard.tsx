import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Calendar, GripVertical, Trash2, Edit3 } from "lucide-react";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import {
  taskService,
  TaskStatus,
  type Task,
} from "@/features/tasks/taskService";
import { TaskCreationModal } from "@/features/tasks/components/TaskCreationModal";
import { TaskEditModal } from "@/features/tasks/components/TaskEditModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { UserRole } from "@/types";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

interface KanbanBoardProps {
  projectId: string;
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: TaskStatus.TODO, title: "À Faire", color: "bg-muted" },
  { id: TaskStatus.IN_PROGRESS, title: "En Cours", color: "bg-primary" },
  { id: TaskStatus.DONE, title: "Terminé", color: "bg-green-500" },
];

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const user = useAuthStore((s) => s.user);
  const canDeleteTask =
    user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;
  const canEditTask =
    user?.role === UserRole.ADMIN || user?.role === UserRole.CHEF_PROJET;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    status?: TaskStatus;
  }>({
    isOpen: false,
  });
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const instructionsId = "kanban-keyboard-instructions";

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getAll({ projectId });
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await taskService.update(taskId, {
        status: newStatus,
      });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      fetchTasks(); // Revert on error
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.delete(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      setTaskToDelete(null);
    } catch {
      toast.error("Impossible de supprimer la tâche");
      setTaskToDelete(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const taskId = draggableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
    );

    handleUpdateStatus(taskId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const focusTask = (status: TaskStatus, index: number) => {
    const columnTasks = getTasksByStatus(status);
    if (!columnTasks.length) return;
    const clampedIndex = Math.max(0, Math.min(index, columnTasks.length - 1));
    const targetTask = columnTasks[clampedIndex];
    const targetEl = document.querySelector<HTMLElement>(
      `[data-kanban-task-id="${targetTask._id}"]`,
    );
    targetEl?.focus();
  };

  const handleCardKeyDown = (
    event: KeyboardEvent,
    status: TaskStatus,
    index: number,
  ) => {
    const currentColumnIndex = COLUMNS.findIndex((col) => col.id === status);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusTask(status, index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusTask(status, index - 1);
        break;
      case "ArrowRight": {
        const nextColumn = COLUMNS[currentColumnIndex + 1];
        if (!nextColumn) return;
        event.preventDefault();
        focusTask(nextColumn.id, index);
        break;
      }
      case "ArrowLeft": {
        const prevColumn = COLUMNS[currentColumnIndex - 1];
        if (!prevColumn) return;
        event.preventDefault();
        focusTask(prevColumn.id, index);
        break;
      }
      case "Home":
        event.preventDefault();
        focusTask(status, 0);
        break;
      case "End": {
        event.preventDefault();
        const columnTasks = getTasksByStatus(status);
        focusTask(status, columnTasks.length - 1);
        break;
      }
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="min-w-[300px] w-[300px] rounded-2xl bg-secondary/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="flex h-full gap-6 overflow-x-auto pb-4 items-start"
        role="region"
        aria-label="Tableau Kanban des tâches"
        aria-describedby={instructionsId}
      >
        <p id={instructionsId} className="sr-only">
          Navigation clavier : utilisez les flèches gauche et droite pour
          changer de colonne, flèches haut et bas pour naviguer entre les tâches
          d'une colonne. Home et End vont au début et à la fin de la colonne.
        </p>
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="min-w-[300px] w-[300px] flex flex-col shrink-0"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-sm text-foreground">
                  {col.title}
                </h3>
                <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {getTasksByStatus(col.id).length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalConfig({ isOpen: true, status: col.id })}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors"
                title="Ajouter une tâche"
                aria-label="Ajouter une tâche"
              >
                <Plus size={16} />
              </button>
            </div>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-3 min-h-[500px] p-2 rounded-xl transition-colors",
                    snapshot.isDraggingOver
                      ? "bg-secondary/20"
                      : "bg-transparent",
                  )}
                  role="list"
                  aria-label={`Colonne ${col.title}`}
                >
                  {getTasksByStatus(col.id).map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "transition-transform",
                            snapshot.isDragging ? "z-50" : "",
                          )}
                        >
                          <AnimatedCard
                            className={cn(
                              "p-4 cursor-grab active:cursor-grabbing border-transparent hover:border-primary/20 group relative",
                              snapshot.isDragging &&
                                "shadow-2xl ring-2 ring-primary/20 border-primary/20 scale-[1.02]",
                            )}
                            role="listitem"
                            tabIndex={0}
                            data-kanban-task-id={task._id}
                            aria-label={`${task.title}, priorité ${task.priority}, colonne ${col.title}`}
                            onKeyDown={(event) =>
                              handleCardKeyDown(event, col.id, index)
                            }
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary uppercase`}
                              >
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1">
                                {canEditTask && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskToEdit(task);
                                    }}
                                    className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Modifier la tâche"
                                    aria-label="Modifier la tâche"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                )}
                                {canDeleteTask && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskToDelete(task);
                                    }}
                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Supprimer la tâche"
                                    aria-label="Supprimer la tâche"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <GripVertical
                                  size={14}
                                  className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
                                />
                              </div>
                            </div>

                            <h4 className="text-sm font-medium text-foreground mb-3 leading-snug">
                              {task.title}
                            </h4>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                              <div className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground uppercase">
                                {task.assigneeId?.prenom?.[0] || "?"}
                              </div>

                              <div className="flex items-center gap-3 text-muted-foreground text-[10px] font-medium">
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString(
                                        "fr-FR",
                                        { day: "numeric", month: "short" },
                                      )
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </AnimatedCard>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  <button
                    onClick={() =>
                      setModalConfig({ isOpen: true, status: col.id })
                    }
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg border border-dashed border-border hover:border-primary/20 transition-all mt-4"
                  >
                    <Plus size={14} /> Ajouter une tâche
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        ))}

        <AnimatePresence>
          {modalConfig.isOpen && (
            <TaskCreationModal
              projectId={projectId}
              initialStatus={modalConfig.status}
              onClose={() => setModalConfig({ isOpen: false })}
              onSuccess={() => {
                setModalConfig({ isOpen: false });
                fetchTasks();
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {taskToEdit && (
            <TaskEditModal
              task={taskToEdit}
              onClose={() => setTaskToEdit(null)}
              onSuccess={(updatedTask) => {
                setTasks((prev) =>
                  prev.map((t) =>
                    t._id === updatedTask._id ? updatedTask : t,
                  ),
                );
                setTaskToEdit(null);
              }}
            />
          )}
        </AnimatePresence>

        <ConfirmationModal
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
          title="Supprimer la tâche"
          description={
            taskToDelete
              ? `Êtes-vous sûr de vouloir supprimer la tâche "${taskToDelete.title}" ?`
              : ""
          }
          confirmLabel="Supprimer"
          variant="danger"
        />
      </div>
    </DragDropContext>
  );
};

// Local utility for conditional classes if not already available in the scope
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
