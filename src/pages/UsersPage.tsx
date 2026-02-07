import { UserList } from '@/features/users/components/UserList';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

export const UsersPage = () => {
    // Set page title
    usePageTitle('Team Members');
    
    return (
        <div className="p-6">
            <UserList />
        </div>
    );
};
