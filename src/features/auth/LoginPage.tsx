import { useState, useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, Eye, EyeOff, Info, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/features/i18n';
import { cn } from '@/lib/utils';
import { AnimatedRobot } from '@/components/ui/AnimatedRobot';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [robotState, setRobotState] = useState<'idle' | 'thinking' | 'error' | 'success'>('idle');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

    // Set page title and force dark mode
    useEffect(() => {
        document.title = t('auth.signInPageTitle');
        
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
        setError('');
        setShowError(false);
        setIsLoading(true);
        setRobotState('thinking');

        try {
            await login(email, password);
            
            // Animation de succès
            setRobotState('success');
            setLoginSuccess(true);
            
            // Attendre l'animation avant de rediriger
            setTimeout(() => {
                navigate('/');
            }, 1500);
            
        } catch (err) {
            setError(t('auth.invalidCredentials'));
            setIsLoading(false);
            
            // Animation d'erreur (shake)
            setRobotState('error');
            setShowError(true);
            
            // Vibration si disponible
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            // Réinitialiser l'animation après
            setTimeout(() => {
                setShowError(false);
                setRobotState('idle');
            }, 2500);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Animated gradient background */}
            <motion.div 
                className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/15 blur-[140px] rounded-full pointer-events-none"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div 
                className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-cyan-500/10 blur-[160px] rounded-full pointer-events-none"
                animate={{
                    x: [0, -30, 0],
                    y: [0, 20, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            
            {/* Floating particles */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/20 rounded-full"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                    }}
                    animate={{
                        y: [null, Math.random() * window.innerHeight],
                        x: [null, Math.random() * window.innerWidth],
                    }}
                    transition={{
                        duration: 10 + Math.random() * 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-sm sm:max-w-lg p-4 sm:p-6 relative z-10 mx-auto"
            >
                {/* Language Selector */}
                <div className="flex justify-end items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <div className="flex gap-1">
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => changeLanguage(lang.code)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                    currentLanguage === lang.code
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
                                )}
                                aria-label={`Switch to ${lang.name}`}
                                aria-pressed={currentLanguage === lang.code}
                            >
                                {lang.code.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div 
                    className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-7 border border-border/80 shadow-2xl bg-card backdrop-blur-sm relative overflow-hidden"
                    animate={showError ? {
                        x: [0, -10, 10, -10, 10, 0],
                        transition: { duration: 0.5 }
                    } : loginSuccess ? {
                        scale: [1, 0.98, 1.02],
                        transition: { duration: 0.6 }
                    } : {}}
                >
                    {/* Success Overlay */}
                    <AnimatePresence>
                        {loginSuccess && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-primary/95 backdrop-blur-md rounded-3xl z-50 flex items-center justify-center"
                            >
                                <div className="text-center">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 200, 
                                            damping: 15,
                                            delay: 0.2 
                                        }}
                                    >
                                        <CheckCircle2 className="h-24 w-24 text-primary-foreground mx-auto mb-4" />
                                    </motion.div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-3xl font-bold text-primary-foreground mb-2"
                                    >
                                        Success!
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-primary-foreground/80"
                                    >
                                        Redirecting...
                                    </motion.p>
                                    
                                    {/* Confetti particles */}
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ 
                                                opacity: 0,
                                                scale: 0,
                                                x: 0,
                                                y: 0
                                            }}
                                            animate={{ 
                                                opacity: [0, 1, 0],
                                                scale: [0, 1, 0.5],
                                                x: (Math.random() - 0.5) * 400,
                                                y: (Math.random() - 0.5) * 400
                                            }}
                                            transition={{ 
                                                duration: 1.5,
                                                delay: i * 0.05,
                                                ease: "easeOut"
                                            }}
                                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor: ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#06b6d4'][i % 5]
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex flex-col items-center text-center mb-2">
                        <motion.div
                            initial={{ scale: 0, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ 
                                delay: 0.2, 
                                type: "spring",
                                stiffness: 200,
                                damping: 15
                            }}
                            className="mb-1"
                        >
                            <AnimatedRobot state={robotState} size={typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 220} />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
                        >
                            {t('auth.welcomeTitle')}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-muted-foreground mt-1 text-sm sm:text-base"
                        >
                            {t('auth.signInDesc')}
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3" aria-label="Login form">
                        <motion.div 
                            className="space-y-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label htmlFor="email-input" className="text-sm font-semibold text-foreground">
                                {t('auth.emailLabel')}
                            </label>
                            <motion.div
                                whileFocus={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all hover:border-primary/30"
                                    placeholder={t('auth.emailPlaceholder')}
                                    aria-label={t('auth.emailLabel')}
                                    aria-required="true"
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "login-error" : "email-helper"}
                                    autoComplete="email"
                                    required
                                />
                            </motion.div>
                            <p id="email-helper" className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" aria-hidden="true" />
                                {t('auth.emailHelper')}
                            </p>
                        </motion.div>

                        <motion.div 
                            className="space-y-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <label htmlFor="password-input" className="text-sm font-semibold text-foreground">
                                {t('auth.passwordLabel')}
                            </label>
                            <motion.div 
                                className="relative"
                                whileFocus={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <input
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all hover:border-primary/30"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    aria-label={t('auth.passwordLabel')}
                                    aria-required="true"
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "login-error" : "password-helper"}
                                    autoComplete="current-password"
                                    required
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </motion.button>
                            </motion.div>
                            <p id="password-helper" className="text-xs text-muted-foreground">
                                {t('auth.passwordHelper')}
                            </p>
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-primary hover:underline"
                                >
                                    {t('auth.forgotPassword')}
                                </Link>
                            </div>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div 
                                        className="text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 flex items-center gap-2"
                                        id="login-error"
                                        role="alert"
                                        aria-live="polite"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                        >
                                            <XCircle className="h-5 w-5 flex-shrink-0" />
                                        </motion.div>
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={!isLoading && !loginSuccess ? { scale: 1.02 } : {}}
                            whileTap={!isLoading && !loginSuccess ? { scale: 0.98 } : {}}
                            type="submit"
                            disabled={isLoading || loginSuccess}
                            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            aria-label={isLoading ? t('auth.signingIn') : t('auth.signInAria')}
                        >
                            <AnimatePresence mode="wait">
                                {loginSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                                        <span>Welcome!</span>
                                    </motion.div>
                                ) : isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 className="animate-spin h-5 w-5" aria-hidden="true" />
                                        <span className="sr-only">{t('auth.signingIn')}</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="default"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        {t('auth.signInButton')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                            {t('auth.secureNote')}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
