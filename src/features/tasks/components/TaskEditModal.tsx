import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, AlignLeft, User, Flag, CheckCircle } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { taskService, TaskStatus, TaskPriority, type Task, type UpdateTaskDto } from '../taskService';
import { userService } from '@/features/users/userService';
import { type User as UserType } from '@/types';
import { toast } from 'sonner';

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
    onSuccess: (updatedTask: Task) => void;
}

export const TaskEditModal = ({ task, onClose, onSuccess }: TaskEditModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<UserType[]>([]);
    const [formData, setFormData] = useState<UpdateTaskDto>({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: typeof task.assigneeId === 'object' && task.assigneeId?._id
            ? (task.assigneeId as any)._id
            : task.assigneeId || '',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await userService.getAll();
                setUsers(allUsers);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            toast.error('Le titre est requis');
            return;
        }

        setIsLoading(true);
        try {
            const updateDto: UpdateTaskDto = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                assigneeId: formData.assigneeId || undefined,
            };

            if (formData.dueDate) {
                updateDto.dueDate = formData.dueDate;
            }

            const updatedTask = await taskService.update(task._id, updateDto);
            toast.success('Tâche mise à jour avec succès');
            onSuccess(updatedTask);
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
            console.error('Update error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.TODO:
                return 'bg-slate-500';
            case TaskStatus.IN_PROGRESS:
                return 'bg-blue-500';
            case TaskStatus.DONE:
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.LOW:
                return 'text-green-500';
            case TaskPriority.MEDIUM:
                return 'text-yellow-500';
            case TaskPriority.HIGH:
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <CheckCircle size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Modifier la Tâche</h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Titre de la tâche</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="ex: Design du header"
                            className="w-full bg-secondary/50 border-border/50 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <AlignLeft className="mt-1 h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 space-y-1">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] border"
                                    placeholder="Ajoutez des détails sur cette tâche..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(formData.status!)}`} />
                            <div className="flex-1 space-y-1">
                                <label className="text-sm font-medium">Statut</label>
                                <select
                                    className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                >
                                    <option value={TaskStatus.TODO}>À faire</option>
                                    <option value={TaskStatus.IN_PROGRESS}>En cours</option>
                                    <option value={TaskStatus.DONE}>Terminé</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Flag className={`h-5 w-5 ${getPriorityColor(formData.priority!)}`} />
                                <div className="flex-1 space-y-1">
                                    <label className="text-sm font-medium">Priorité</label>
                                    <select
                                        className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                    >
                                        <option value={TaskPriority.LOW}>Basse</option>
                                        <option value={TaskPriority.MEDIUM}>Moyenne</option>
                                        <option value={TaskPriority.HIGH}>Haute</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <label className="text-sm font-medium">Échéance</label>
                                    <input
                                        type="date"
                                        className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border appearance-none"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 space-y-1">
                                <label className="text-sm font-medium">Assigner à</label>
                                <select
                                    className="w-full bg-secondary/30 border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                    value={formData.assigneeId}
                                    onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                                >
                                    <option value="">Non assigné</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-border/50 bg-secondary/10 flex justify-end gap-3">
                    <PremiumButton variant="outline" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </PremiumButton>
                    <PremiumButton
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        disabled={!formData.title?.trim()}
                    >
                        Mettre à jour
                    </PremiumButton>
                </div>
            </motion.div>
        </div>
    );
};
