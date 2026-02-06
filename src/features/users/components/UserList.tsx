import { useState, useEffect } from 'react';
import { userService } from '@/features/users/userService';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { UserPlus, Search, Download } from 'lucide-react';
import { UserForm } from './UserForm';
import { UserFilters } from './UserFilters';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { UserCard } from './UserCard';
import { motion, AnimatePresence } from 'framer-motion';

export const UserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            try {
                await userService.delete(deleteId);
                setUsers(users.filter(u => u.id !== deleteId));
            } catch (error) {
                console.error('Failed to delete user', error);
            } finally {
                setDeleteId(null);
            }
        }
    };

    const handleToggleStatus = async (user: User) => {
        // Optimistic update using boolean isActive
        const updatedUser = { ...user, isActive: !user.isActive };
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        try {
            await userService.toggleStatus(user.id);
        } catch (error) {
            // Revert on error
            setUsers(users.map(u => u.id === user.id ? user : u));
            console.error('Failed to toggle status', error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchUsers();
    };

    const handleToggleRole = (role: UserRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleExportCSV = () => {
        const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status', 'Phone', 'Position'];
        const csvContent = [
            headers.join(','),
            ...filteredUsers.map(user => [
                user.prenom,
                user.nom,
                user.email,
                user.role,
                user.isActive ? 'Active' : 'Inactive',
                user.telephone || '',
                user.poste || ''
            ].map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'users_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);

        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'active' ? user.isActive : !user.isActive;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                description="Are you sure you want to delete this user permanently? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full bg-secondary/50 text-foreground pl-10 pr-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder-muted-foreground text-sm"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <UserFilters
                        selectedRoles={selectedRoles}
                        onToggleRole={handleToggleRole}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                    />

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-sm font-medium"
                        title="Export to CSV"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all text-sm font-bold"
                        >
                            <UserPlus size={16} />
                            Add Member
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Grid Content */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-muted opacity-50"></div>
                        <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                </div>
            ) : filteredUsers.length > 0 ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <AnimatePresence>
                        {filteredUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                onToggleStatus={handleToggleStatus}
                                isCurrentUser={currentUser?.id === user.id}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 border border-dashed border-border rounded-xl bg-secondary/5">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No members found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        We couldn't find any members matching your filters. Try adjusting your search or filters.
                    </p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedRoles([]);
                            setStatusFilter('all');
                        }}
                        className="mt-4 text-sm font-medium text-primary hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Slide-over Form Container (Replacing Modal) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl z-10"
                        >
                            <UserForm user={editingUser} onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
