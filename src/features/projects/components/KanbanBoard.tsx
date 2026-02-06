import { MoreHorizontal, Plus, Calendar, Paperclip, MessageSquare } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

type Task = {
    id: string;
    title: string;
    tag: string;
    tagColor: string;
    members: string[];
    comments: number;
    attachments: number;
    dueDate: string;
};

type Column = {
    id: string;
    title: string;
    tasks: Task[];
    color: string;
};

const columns: Column[] = [
    {
        id: 'todo',
        title: 'To Do',
        color: 'bg-slate-500',
        tasks: [
            { id: '1', title: 'Research competitors', tag: 'Strategy', tagColor: 'bg-blue-500/10 text-blue-600', members: ['A', 'B'], comments: 2, attachments: 1, dueDate: 'Tomorrow' },
            { id: '2', title: 'Draft project brief', tag: 'Planning', tagColor: 'bg-purple-500/10 text-purple-600', members: ['C'], comments: 0, attachments: 0, dueDate: 'Feb 12' },
        ]
    },
    {
        id: 'in-progress',
        title: 'In Progress',
        color: 'bg-blue-500',
        tasks: [
            { id: '3', title: 'Design Homepage (v2)', tag: 'Design', tagColor: 'bg-pink-500/10 text-pink-600', members: ['A', 'D', 'E'], comments: 5, attachments: 3, dueDate: 'Today' },
            { id: '4', title: 'API Integration', tag: 'Dev', tagColor: 'bg-indigo-500/10 text-indigo-600', members: ['F'], comments: 1, attachments: 0, dueDate: 'Feb 15' },
            { id: '5', title: 'Content for About page', tag: 'Content', tagColor: 'bg-orange-500/10 text-orange-600', members: ['G'], comments: 8, attachments: 2, dueDate: 'Feb 14' },
        ]
    },
    {
        id: 'review',
        title: 'In Review',
        color: 'bg-yellow-500',
        tasks: [
            { id: '6', title: 'User Testing Session', tag: 'Research', tagColor: 'bg-teal-500/10 text-teal-600', members: ['B', 'H'], comments: 12, attachments: 5, dueDate: 'Just now' },
        ]
    },
    {
        id: 'done',
        title: 'Done',
        color: 'bg-green-500',
        tasks: [
            { id: '7', title: 'Project Kickoff', tag: 'Meeting', tagColor: 'bg-gray-500/10 text-gray-600', members: ['All'], comments: 0, attachments: 1, dueDate: 'Jan 20' },
        ]
    }
];

export const KanbanBoard = () => {
    return (
        <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
            {columns.map((col, index) => (
                <div key={col.id} className="min-w-[300px] w-[300px] flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            <h3 className="font-semibold text-sm text-foreground">{col.title}</h3>
                            <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">{col.tasks.length}</span>
                        </div>
                        <div className="flex gap-1">
                            <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors">
                                <Plus size={16} />
                            </button>
                            <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {col.tasks.map((task, taskIndex) => (
                            <AnimatedCard
                                key={task.id}
                                className="p-4 cursor-grab active:cursor-grabbing border-transparent hover:border-primary/20 group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + taskIndex * 0.05 }}
                                whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${task.tagColor}`}>
                                        {task.tag}
                                    </span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                <h4 className="text-sm font-medium text-foreground mb-3 leading-snug">{task.title}</h4>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                                    <div className="flex -space-x-2">
                                        {task.members.map((m, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground uppercase">
                                                {m}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 text-muted-foreground text-[10px] font-medium">
                                        {task.attachments > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Paperclip size={12} /> {task.attachments}
                                            </div>
                                        )}
                                        {task.comments > 0 && (
                                            <div className="flex items-center gap-1">
                                                <MessageSquare size={12} /> {task.comments}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-orange-500/80">
                                            <Calendar size={12} /> {task.dueDate}
                                        </div>
                                    </div>
                                </div>
                            </AnimatedCard>
                        ))}

                        <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg border border-dashed border-border hover:border-primary/20 transition-all">
                            <Plus size={14} /> Add Task
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
