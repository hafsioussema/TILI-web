import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from './authService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    useEffect(() => {
        document.title = t('auth.forgotPageTitle');
        
        // Force dark mode on this page
        const root = document.documentElement;
        const previousTheme = root.classList.contains('dark');
        root.classList.add('dark');
        
        // Cleanup: restore previous theme when leaving the page
        return () => {
            if (!previousTheme) {
                root.classList.remove('dark');
            }
        };
    }, [t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
            toast.success(t('auth.otpSentToast'));
        } catch {
            toast.error(t('auth.otpSendError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = () => {
        navigate('/reset-password', { state: { email } });
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
                                        <Mail className="text-primary h-8 w-8" />
                                    </motion.div>
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.forgotTitle')}</h1>
                                    <p className="text-muted-foreground mt-2 text-base">
                                        {t('auth.forgotDesc')}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="email-input" className="text-sm font-semibold text-foreground">
                                            {t('auth.emailLabel')}
                                        </label>
                                        <input
                                            id="email-input"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                            placeholder={t('auth.emailPlaceholder')}
                                            required
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <>{t('auth.sendCode')}</>
                                        )}
                                    </motion.button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {t('auth.backToLogin')}
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
                                    <h1 className="text-2xl font-bold text-foreground">{t('auth.codeSentTitle')}</h1>
                                    <p className="text-muted-foreground mt-2">
                                        {t('auth.codeSentDesc', { email })}
                                    </p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleContinue}
                                    className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    {t('auth.enterCode')}
                                </motion.button>

                                <p className="mt-4 text-sm text-muted-foreground">
                                    {t('auth.noEmail')}{' '}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="text-primary hover:underline"
                                    >
                                        {t('auth.resend')}
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
