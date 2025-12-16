import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCRM } from '@/contexts/CRMContext';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const { tasks } = useCRM();
  
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Overdue');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div>
        <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {pendingTasks.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {pendingTasks.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pendingTasks.slice(0, 5).map((task) => (
              <DropdownMenuItem key={task.id} className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={task.status === 'Overdue' ? 'destructive' : 'secondary'} className="text-xs">
                    {task.status}
                  </Badge>
                  <span className="font-medium text-sm">{task.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{task.customerName} - {task.remarks}</p>
              </DropdownMenuItem>
            ))}
            {pendingTasks.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No pending notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
