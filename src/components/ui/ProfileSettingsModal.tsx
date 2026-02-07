import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Mail, Phone, Briefcase, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { authService } from '@/features/auth/authService';
import { PremiumButton } from './PremiumButton';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileSettingsModal = ({ isOpen, onClose }: ProfileSettingsModalProps) => {
    const { user } = useAuthStore();
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        telephone: user?.telephone || '',
        poste: user?.poste || '',
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('L\'image ne doit pas dépasser 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload the file
        setIsUploading(true);
        try {
            await authService.uploadAvatar(file);
            toast.success('Photo de profil mise à jour');
            await checkAuth(); // Refresh user data
        } catch {
            toast.error('Erreur lors du téléchargement');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await authService.updateProfile(formData);
            toast.success('Profil mis à jour');
            await checkAuth(); // Refresh user data
            onClose();
        } catch {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setIsSaving(false);
        }
    };

    const avatarUrl = previewUrl || (user?.avatar ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.avatar}` : null);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Paramètres du Profil</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-2xl font-bold text-white border-4 border-background shadow-lg">
                                    {avatarUrl ? (
                                        <img 
                                            src={avatarUrl} 
                                            alt="Avatar" 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Cliquez pour changer votre photo
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-secondary/50 border-border/50 rounded-xl px-4 py-3 border text-muted-foreground cursor-not-allowed"
                            />
                            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    placeholder="+33 6 12 34 56 78"
                                    className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    Poste
                                </label>
                                <input
                                    type="text"
                                    value={formData.poste}
                                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                                    placeholder="Développeur Senior"
                                    className="w-full bg-secondary/30 border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 border"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-secondary/10 flex justify-end gap-3">
                        <PremiumButton variant="outline" onClick={onClose}>
                            Annuler
                        </PremiumButton>
                        <PremiumButton onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Enregistrer
                                </>
                            )}
                        </PremiumButton>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
