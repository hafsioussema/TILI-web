import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ArrowRight, MoreHorizontal } from 'lucide-react';

const projects = [
    { name: "Website Redesign", status: "In Progress", progress: 65, team: 4, dueDate: "Dec 31" },
    { name: "Mobile App Launch", status: "Review", progress: 90, team: 6, dueDate: "Jan 15" },
    { name: "Marketing Campaign", status: "Planning", progress: 15, team: 3, dueDate: "Feb 01" },
    { name: "Internal Tooling", status: "In Progress", progress: 45, team: 2, dueDate: "Feb 10" },
];

export const ActiveProjects = () => {
    return (
        <AnimatedCard className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
                    <p className="text-sm text-muted-foreground">You have 4 active projects</p>
                </div>
                <PremiumButton variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></PremiumButton>
            </div>

            <div className="space-y-4">
                {projects.map((project, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer">
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center justify-between p-0 mb-2">
                                <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{project.name}</h3>
                                <span className="text-xs text-muted-foreground">{project.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium w-8 text-right">{project.progress}%</span>
                            </div>
                        </div>

                        <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </AnimatedCard>
    );
};
