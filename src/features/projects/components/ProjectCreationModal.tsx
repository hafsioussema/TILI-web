import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Calendar, ChevronRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { userService } from '@/features/users/userService';
import { projectService } from '../projectService';
import { UserRole, type User } from '@/types';
import { type CreateProjectDto } from '@/types/documents';
import { cn } from '@/lib/utils';

interface ProjectCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ProjectCreationModal = ({ onClose, onSuccess }: ProjectCreationModalProps) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState<CreateProjectDto>({
        name: '',
        description: '',
        managerId: '',
        members: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        progress: 0,
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await userService.getAll();
                setUsers(allUsers);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                toast.error('Erreur lors du chargement des utilisateurs');
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.managerId) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        setIsSubmitting(true);
        try {
            await projectService.create(formData);
            toast.success('Projet créé avec succès');
            onSuccess();
        } catch (error) {
            console.error('Project creation failed:', error);
            toast.error('Erreur lors de la création du projet');
        } finally {
            setIsSubmitting(false);
        }
    };

    const managers = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.CHEF_PROJET);
    const consultants = users.filter(u => u.role === UserRole.CONSULTANT);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Nouveau Projet</h2>
                            <p className="text-sm text-muted-foreground">Étape {step} sur 2</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Nom du projet *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            placeholder="Ex: Refonte Plateforme Inclusion"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
                                            placeholder="Décrivez les objectifs du projet..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Date de début</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Date de fin prévue</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Chef de projet *</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                            {managers.map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, managerId: user.id })}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                        formData.managerId === user.id
                                                            ? "bg-primary/10 border-primary border-2"
                                                            : "bg-secondary/50 border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                        {user.nom[0]}{user.prenom[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate leading-tight">{user.nom} {user.prenom}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate uppercase">{user.role}</p>
                                                    </div>
                                                    {formData.managerId === user.id && (
                                                        <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Équipe (Consultants)</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {consultants.map(user => {
                                                const isSelected = formData.members?.includes(user.id);
                                                return (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const members = isSelected
                                                                ? formData.members?.filter(id => id !== user.id)
                                                                : [...(formData.members || []), user.id];
                                                            setFormData({ ...formData, members });
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                            isSelected
                                                                ? "bg-primary/10 border-primary border-2"
                                                                : "bg-secondary/50 border-border hover:border-primary/50"
                                                        )}
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                            {user.nom[0]}{user.prenom[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate leading-tight">{user.nom} {user.prenom}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase">Consultant</p>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Annuler
                        </button>

                        <div className="flex items-center gap-3">
                            {step === 2 && (
                                <PremiumButton
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                >
                                    Précédent
                                </PremiumButton>
                            )}

                            {step === 1 ? (
                                <PremiumButton
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name}
                                >
                                    Suivant
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </PremiumButton>
                            ) : (
                                <PremiumButton
                                    type="submit"
                                    disabled={isSubmitting || !formData.managerId}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Création...
                                        </>
                                    ) : (
                                        'Créer le projet'
                                    )}
                                </PremiumButton>
                            )}
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
