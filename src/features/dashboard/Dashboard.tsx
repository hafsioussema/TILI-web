import { useAuthStore } from '@/features/auth/useAuthStore';
import { UserRole } from '@/types';
import { DashboardAdmin } from './DashboardAdmin';
import { DashboardPM } from './DashboardPM';
import { DashboardConsultant } from './DashboardConsultant';
import { Loader2 } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

export const Dashboard = () => {
    const { user, isLoading } = useAuthStore();
    
    // Set page title
    usePageTitle('Dashboard');

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    switch (user.role) {
        case UserRole.ADMIN:
            return <DashboardAdmin />;
        case UserRole.CHEF_PROJET:
            return <DashboardPM />;
        case UserRole.CONSULTANT:
            return <DashboardConsultant />;
        default:
            return <DashboardConsultant />; // Default safe view
    }
};
