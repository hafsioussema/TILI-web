import { UserList } from '@/features/users/components/UserList';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export const UsersPage = () => {
    const { t } = useTranslation('common');
    // Set page title
    usePageTitle(t('users.pageTitle'));
    
    return (
        <div className="p-6">
            <UserList />
        </div>
    );
};
