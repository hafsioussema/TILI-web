import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { botService, type BotMessage } from './botService';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/useAuthStore';

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 480;

export const TiliBot = () => {
    const user = useAuthStore((s) => s.user);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<BotMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const load = async () => {
            if (!user?.id) {
                setMessages([]);
                setIsLoadingHistory(false);
                return;
            }
            setIsLoadingHistory(true);
            try {
                const history = await botService.getConversation();
                setMessages(history);
            } catch {
                setMessages([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        load();
    }, [user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');
        const userMessage: BotMessage = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const history = [...messages, userMessage].slice(-20);
            const reply = await botService.chat(text, history);
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
            // Synchroniser l'historique depuis la base (ne pas afficher d'erreur si ce seul appel échoue)
            try {
                const fromDb = await botService.getConversation();
                setMessages(fromDb);
            } catch {
                // Garder les messages locaux si le rechargement échoue
            }
        } catch (err) {
            console.error('TILIBOT error:', err);
            toast.error('Erreur de connexion à TILIBOT');
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Désolé, je n’ai pas pu répondre. Vérifiez votre connexion ou réessayez plus tard.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="fixed z-[100] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
                        style={{
                            right: 24,
                            bottom: 88,
                            width: PANEL_WIDTH,
                            height: PANEL_HEIGHT,
                            maxHeight: 'calc(100vh - 120px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">TILIBOT</h3>
                                    <p className="text-[10px] text-muted-foreground">Assistant TILI</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {isLoadingHistory && (
                                <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>
                            )}
                            {!isLoadingHistory && messages.length === 0 && (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    <p className="mb-2">Bonjour, je suis TILIBOT.</p>
                                    <p>Posez-moi des questions sur les projets, tâches, documents ou votre rôle.</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                                : 'bg-secondary/80 text-foreground rounded-bl-md border border-border/50'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-secondary/80 border border-border/50">
                                        <span className="inline-flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-border bg-background/50 shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Écrire un message..."
                                    rows={1}
                                    className="flex-1 min-h-[40px] max-h-24 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                    aria-label="Envoyer"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble button */}
            <motion.button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className="fixed z-[99] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                style={{ right: 24, bottom: 24 }}
                aria-label={isOpen ? 'Fermer TILIBOT' : 'Ouvrir TILIBOT'}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-6 w-6" />
                )}
            </motion.button>
        </>
    );
};
