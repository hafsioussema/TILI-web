import { useState, useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    // Set page title
    useEffect(() => {
        document.title = 'Sign In - TILI Workspace';
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
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
                    <div className="flex flex-col items-center text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6"
                        >
                            <ShieldCheck className="text-primary h-8 w-8" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Bienvenue</h1>
                        <p className="text-muted-foreground mt-2 text-base">
                            Connectez-vous pour acceder a votre espace collaboratif.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">
                        <div className="space-y-2">
                            <label htmlFor="email-input" className="text-sm font-semibold text-foreground">
                                Email
                            </label>
                            <input
                                id="email-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                placeholder="nom@organisation.org"
                                aria-label="Email address"
                                aria-required="true"
                                aria-invalid={!!error}
                                aria-describedby={error ? "login-error" : "email-helper"}
                                autoComplete="email"
                                required
                            />
                            <p id="email-helper" className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" aria-hidden="true" />
                                Utilisez votre adresse professionnelle.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password-input" className="text-sm font-semibold text-foreground">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                    placeholder="••••••••"
                                    aria-label="Password"
                                    aria-required="true"
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "login-error" : "password-helper"}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p id="password-helper" className="text-xs text-muted-foreground">
                                8 caracteres minimum.
                            </p>
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-primary hover:underline"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-4 py-3"
                                id="login-error"
                                role="alert"
                                aria-live="polite"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={isLoading ? "Signing in..." : "Sign in to workspace"}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5" aria-hidden="true" />
                                    <span className="sr-only">Signing in...</span>
                                </>
                            ) : (
                                <>
                                    Se connecter <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-muted-foreground">
                            Connexion securisee et conforme aux standards de votre organisation.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
