import { UserRole } from '@/types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Filter, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserFiltersProps {
    selectedRoles: UserRole[];
    onToggleRole: (role: UserRole) => void;
    statusFilter: 'all' | 'active' | 'inactive';
    onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

export const UserFilters = ({
    selectedRoles,
    onToggleRole,
    statusFilter,
    onStatusChange
}: UserFiltersProps) => {
    const activeCount = selectedRoles.length + (statusFilter !== 'all' ? 1 : 0);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-sm font-medium outline-none",
                    activeCount > 0
                        ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                    <Filter size={16} />
                    Filters
                    {activeCount > 0 && (
                        <span className="flex items-center justify-center bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full ml-1 font-bold">
                            {activeCount}
                        </span>
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="min-w-[220px] bg-popover rounded-xl shadow-xl border border-border p-2 z-50 animate-in fade-in zoom-in-95 duration-200">

                    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Status
                    </DropdownMenu.Label>

                    <DropdownMenu.RadioGroup value={statusFilter} onValueChange={(val: string) => onStatusChange(val as any)}>
                        {[
                            { val: 'all', label: 'All Users' },
                            { val: 'active', label: 'Active Only' },
                            { val: 'inactive', label: 'Inactive Only' }
                        ].map((item) => (
                            <DropdownMenu.RadioItem
                                key={item.val}
                                value={item.val}
                                className="flex items-center px-2 py-2 text-sm rounded-lg hover:bg-secondary cursor-pointer outline-none transition-colors mb-0.5"
                            >
                                <span className={cn(
                                    "flex items-center justify-center w-4 h-4 mr-2 rounded-full border",
                                    statusFilter === item.val ? "border-primary bg-primary" : "border-muted-foreground"
                                )}>
                                    {statusFilter === item.val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </span>
                                {item.label}
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>

                    <DropdownMenu.Separator className="h-px bg-border my-2" />

                    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Role
                    </DropdownMenu.Label>

                    {[
                        { val: UserRole.ADMIN, label: 'Admin' },
                        { val: UserRole.CHEF_PROJET, label: 'Project Lead' },
                        { val: UserRole.CONSULTANT, label: 'Consultant' }
                    ].map((role) => {
                        const isSelected = selectedRoles.includes(role.val);
                        return (
                            <DropdownMenu.CheckboxItem
                                key={role.val}
                                checked={isSelected}
                                onCheckedChange={() => onToggleRole(role.val)}
                                className="flex items-center px-2 py-2 text-sm rounded-lg hover:bg-secondary cursor-pointer outline-none transition-colors mb-0.5 group"
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-4 h-4 mr-2 rounded border transition-colors",
                                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground group-hover:border-foreground"
                                )}>
                                    {isSelected && <Check size={10} strokeWidth={4} />}
                                </div>
                                {role.label}
                            </DropdownMenu.CheckboxItem>
                        );
                    })}

                    {(activeCount > 0) && (
                        <>
                            <DropdownMenu.Separator className="h-px bg-border my-2" />
                            <DropdownMenu.Item
                                onClick={() => {
                                    onStatusChange('all');
                                    selectedRoles.forEach(r => onToggleRole(r)); // This logic needs to be handled in parent actually, but simplest is to just expose a clear function.
                                    // Hacky clear: parent will need to handle reset manually or we just toggle individually.
                                    // Better: UI logic handled in parent or we emit event.
                                    // Let's keep it simple: manual uncheck or we add Clear button logic in parent.
                                }}
                                className="flex items-center justify-center px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                            >
                                Reset Filters
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
