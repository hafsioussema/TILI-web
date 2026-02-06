import { useState, useEffect } from 'react';
import { userService } from '@/features/users/userService'; // Updated import path
import { UserRole } from '@/types';
import type { User } from '@/types';
import { Loader2, X, Mail, Phone, Briefcase, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Define Interface locally or import if available
interface CreateUserPayload {
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    telephone?: string;
    poste?: string;
}

interface UserFormProps {
    user?: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export const UserForm = ({ user, onSuccess, onCancel }: UserFormProps) => {
    const isEdit = !!user;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateUserPayload>({
        nom: '',
        prenom: '',
        email: '',
        role: UserRole.CONSULTANT,
        telephone: '',
        poste: '',
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                telephone: user.telephone || '',
                poste: user.poste || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null); // Clear error on change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isEdit && user) {
                await userService.update(user.id, formData);
            } else {
                await userService.create(formData);
            }
            onSuccess();
        } catch (error: any) {
            console.error('Error saving user', error);
            if (error.response?.status === 409) {
                setError('This email address is already in use by another member.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-background sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        {isEdit ? 'Edit Profile' : 'New Member'}
                    </h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Manage access and details</p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
                        >
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary to-muted border border-border flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                            {formData.prenom?.[0] || 'T'}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">First Name</label>
                                    <input
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        required
                                        placeholder="Jane"
                                        className="w-full bg-secondary/30 border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-input transition-all placeholder-muted-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Name</label>
                                    <input
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        required
                                        placeholder="Doe"
                                        className="w-full bg-secondary/30 border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-input transition-all placeholder-muted-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Mail size={10} /> Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="jane@project-tili.com"
                            className="w-full bg-secondary/30 border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-input transition-all placeholder-muted-foreground"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Shield size={10} /> Role Assignment
                        </label>
                        <div className="grid gap-2">
                            {[
                                { val: UserRole.ADMIN, label: 'Admin', desc: 'Full access to all settings and data.' },
                                { val: UserRole.CHEF_PROJET, label: 'Project Lead', desc: 'Can manage projects and assigned teams.' },
                                { val: UserRole.CONSULTANT, label: 'Consultant', desc: 'Limited access to assigned tasks.' }
                            ].map((roleOption) => (
                                <label
                                    key={roleOption.val}
                                    className={cn(
                                        "flex items-start p-3 rounded-lg border cursor-pointer transition-all",
                                        formData.role === roleOption.val
                                            ? "bg-primary/10 border-primary/50"
                                            : "bg-background border-border hover:border-input hover:bg-secondary/50"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={roleOption.val}
                                        checked={formData.role === roleOption.val}
                                        onChange={handleChange}
                                        className="mt-1"
                                    />
                                    <div className="ml-3">
                                        <p className={cn("text-sm font-medium", formData.role === roleOption.val ? "text-primary" : "text-foreground")}>{roleOption.label}</p>
                                        <p className="text-xs text-muted-foreground">{roleOption.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Phone size={10} /> Phone
                            </label>
                            <input
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                placeholder="+216"
                                className="w-full bg-secondary/30 border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-input transition-all placeholder-muted-foreground"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Briefcase size={10} /> Position
                            </label>
                            <input
                                name="poste"
                                value={formData.poste}
                                onChange={handleChange}
                                placeholder="HR Manager"
                                className="w-full bg-secondary/30 border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-input transition-all placeholder-muted-foreground"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-background flex justify-end gap-3 sticky bottom-0 z-10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancel
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    form="user-form"
                    disabled={loading}
                    className="px-6 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Changes'}
                </motion.button>
            </div>
        </div>
    );
};
