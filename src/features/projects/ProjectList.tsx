import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard } from './components/KanbanBoard';
import { LayoutGrid, List as ListIcon, Plus, Filter } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export const ProjectList = () => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Projects</h1>
                    <p className="text-muted-foreground mt-1">Manage your team's ongoing work.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>

                    <PremiumButton variant="outline" size="icon">
                        <Filter size={18} />
                    </PremiumButton>

                    <PremiumButton>
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </PremiumButton>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    {viewMode === 'kanban' ? (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <KanbanBoard />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatedCard>
                                <div className="p-8 text-center text-muted-foreground">
                                    List view implementation...
                                </div>
                            </AnimatedCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
