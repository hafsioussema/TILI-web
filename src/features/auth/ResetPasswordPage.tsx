import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from './authService';
import { toast } from 'sonner';

export const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.title = 'Réinitialiser le mot de passe - TILI Workspace';
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(email, otpCode, newPassword);
            setIsSuccess(true);
            toast.success('Mot de passe réinitialisé avec succès');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Code invalide ou expiré');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-cyan-500/10 blur-[160px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg p-6 md:p-10 relative z-10"
            >
                <div className="rounded-3xl p-8 md:p-10 border border-border/80 shadow-2xl bg-card">
                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="flex flex-col items-center text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6"
                                    >
                                        <KeyRound className="text-primary h-8 w-8" />
                                    </motion.div>
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Nouveau mot de passe</h1>
                                    <p className="text-muted-foreground mt-2 text-base">
                                        Entrez le code reçu et votre nouveau mot de passe.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {!location.state?.email && (
                                        <div className="space-y-2">
                                            <label htmlFor="email-input" className="text-sm font-semibold text-foreground">
                                                Email
                                            </label>
                                            <input
                                                id="email-input"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                placeholder="nom@organisation.org"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label htmlFor="otp-input" className="text-sm font-semibold text-foreground">
                                            Code de vérification
                                        </label>
                                        <input
                                            id="otp-input"
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Entrez le code à 6 chiffres reçu par email
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="password-input" className="text-sm font-semibold text-foreground">
                                            Nouveau mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password-input"
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="confirm-password-input" className="text-sm font-semibold text-foreground">
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            id="confirm-password-input"
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading || otpCode.length !== 6}
                                        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <>Réinitialiser le mot de passe</>
                                        )}
                                    </motion.button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Renvoyer un code
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="flex flex-col items-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring" }}
                                        className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6"
                                    >
                                        <CheckCircle className="text-emerald-500 h-8 w-8" />
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-foreground">Mot de passe mis à jour !</h1>
                                    <p className="text-muted-foreground mt-2">
                                        Votre mot de passe a été réinitialisé avec succès.
                                    </p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Se connecter
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
