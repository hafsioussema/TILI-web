import { AnimatedCard } from '@/components/ui/AnimatedCard';

const activities = [
    { user: "Alex M.", action: "commented on", target: "Homepage Design", time: "2m ago", avatar: "A" },
    { user: "Sarah K.", action: "uploaded", target: "Q4 Report.pdf", time: "15m ago", avatar: "S" },
    { user: "Mike J.", action: "completed", target: "Fix navigation bug", time: "1h ago", avatar: "M" },
    { user: "Emily R.", action: "created", target: "New Project: Alpha", time: "3h ago", avatar: "E" },
];

export const RecentActivity = () => {
    return (
        <AnimatedCard className="h-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>

            <div className="relative border-l border-border/50 ml-3 space-y-6">
                {activities.map((activity, i) => (
                    <div key={i} className="ml-6 relative">
                        <span className="absolute -left-[31px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <p className="text-sm text-foreground">
                                <span className="font-medium hover:underline cursor-pointer">{activity.user}</span> {activity.action} <span className="font-medium text-primary/80">{activity.target}</span>
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                ))}
            </div>
        </AnimatedCard>
    );
};
