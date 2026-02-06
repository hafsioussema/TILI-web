import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Calendar, Clock, Video, Users } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';

const meetings = [
    { title: "Weekly Sync", time: "10:00 AM - 11:00 AM", date: "Today, Feb 12", type: "Remote", attendees: 5, status: "upcoming" },
    { title: "Design Review", time: "02:00 PM - 03:30 PM", date: "Today, Feb 12", type: "In Person", attendees: 3, status: "upcoming" },
    { title: "Client Update", time: "04:00 PM - 04:30 PM", date: "Tomorrow, Feb 13", type: "Remote", attendees: 2, status: "upcoming" },
    { title: "Retrospective", time: "11:00 AM - 12:00 PM", date: "Friday, Feb 14", type: "In Person", attendees: 8, status: "upcoming" },
];

export const MeetingTimeline = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Meetings</h1>
                    <p className="text-muted-foreground mt-1">Your upcoming schedule.</p>
                </div>
                <PremiumButton>Schedule Meeting</PremiumButton>
            </div>

            <div className="relative border-l-2 border-border ml-4 space-y-8 py-2">
                {meetings.map((meeting, index) => (
                    <div key={index} className="ml-8 relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[41px] top-6 h-4 w-4 rounded-full bg-background border-4 border-primary shadow-sm" />

                        <AnimatedCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-primary/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-foreground">{meeting.title}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-primary uppercase tracking-wide">
                                        {meeting.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {meeting.date}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {meeting.time}</span>
                                    <span className="flex items-center gap-1.5"><Users size={14} /> {meeting.attendees} Attendees</span>
                                </div>
                            </div>

                            <div>
                                <PremiumButton variant={index === 0 ? "primary" : "outline"} size="sm" className="w-full sm:w-auto">
                                    {index === 0 ? <><Video className="mr-2 h-4 w-4" /> Join Now</> : "View Details"}
                                </PremiumButton>
                            </div>
                        </AnimatedCard>
                    </div>
                ))}
            </div>
        </div>
    );
};
