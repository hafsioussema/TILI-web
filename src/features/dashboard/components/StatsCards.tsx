import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Briefcase, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const stats = [
    {
        title: "Total Projects",
        value: "12",
        label: "Active Projects",
        icon: Briefcase,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        trend: "+2 this month"
    },
    {
        title: "Tasks Completed",
        value: "1,234",
        label: "Tasks Done",
        icon: CheckCircle2,
        color: "text-green-500",
        bg: "bg-green-500/10",
        trend: "+15% vs last week"
    },
    {
        title: "Hours Logged",
        value: "456",
        label: "Total Hours",
        icon: Clock,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        trend: "On track"
    },
    {
        title: "Productivity",
        value: "94%",
        label: "Efficiency Rate",
        icon: TrendingUp,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        trend: "+4% increase"
    }
];

export const StatsCards = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <AnimatedCard key={index} className="flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-2xl font-bold mt-1 text-foreground">{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-muted-foreground">
                        <span className="text-green-500 font-medium mr-1">{stat.trend}</span>
                    </div>
                </AnimatedCard>
            ))}
        </div>
    );
};
