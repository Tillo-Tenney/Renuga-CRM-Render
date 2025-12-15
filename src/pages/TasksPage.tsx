import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Phone,
  Truck,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Task } from '@/data/mockData';
import { cn } from '@/lib/utils';

const TasksPage = () => {
  const { tasks, addTask, updateTask, completeTask, leads, orders, currentUser, users } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'done'>('pending');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Follow-up' as Task['type'],
    linkedTo: 'Lead' as Task['linkedTo'],
    linkedId: '',
    customerName: '',
    dueDate: '',
    dueTime: '',
    assignedTo: currentUser.name,
    remarks: '',
  });

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'pending') {
        return matchesSearch && (task.status === 'Pending' || task.status === 'Overdue');
      }
      if (activeTab === 'done') {
        return matchesSearch && task.status === 'Done';
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by status (Overdue first, then Pending, then Done)
      const statusOrder = { Overdue: 0, Pending: 1, Done: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const overdueCount = tasks.filter((t) => t.status === 'Overdue').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.dueDate) {
      toast.error('Please fill in required fields');
      return;
    }

    addTask({
      type: formData.type,
      linkedTo: formData.linkedTo,
      linkedId: formData.linkedId || 'MANUAL',
      customerName: formData.customerName,
      dueDate: new Date(`${formData.dueDate}T${formData.dueTime || '09:00'}`),
      status: 'Pending',
      assignedTo: formData.assignedTo,
      remarks: formData.remarks,
    });

    toast.success('Task created successfully!');
    setIsDialogOpen(false);
    setFormData({
      type: 'Follow-up',
      linkedTo: 'Lead',
      linkedId: '',
      customerName: '',
      dueDate: '',
      dueTime: '',
      assignedTo: currentUser.name,
      remarks: '',
    });
  };

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
    toast.success('Task marked as done!');
  };

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'Follow-up':
        return <Phone className="h-4 w-4" />;
      case 'Delivery':
        return <Truck className="h-4 w-4" />;
      case 'Call Back':
        return <Phone className="h-4 w-4" />;
      case 'Meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Tasks" subtitle="Manage follow-ups and action items" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className={cn('cursor-pointer transition-all', activeTab === 'pending' && 'ring-2 ring-primary')}>
            <CardContent className="p-4" onClick={() => setActiveTab('pending')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
              {overdueCount > 0 && (
                <div className="mt-2 flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {overdueCount} overdue
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn('cursor-pointer transition-all', activeTab === 'done' && 'ring-2 ring-primary')}>
            <CardContent className="p-4" onClick={() => setActiveTab('done')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{doneCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className={cn('cursor-pointer transition-all', activeTab === 'all' && 'ring-2 ring-primary')}>
            <CardContent className="p-4" onClick={() => setActiveTab('all')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new follow-up or action item
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as Task['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Call Back">Call Back</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Link To</Label>
                    <Select
                      value={formData.linkedTo}
                      onValueChange={(value) => setFormData({ ...formData, linkedTo: value as Task['linkedTo'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Order">Order</SelectItem>
                        <SelectItem value="Call">Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Time</Label>
                    <Input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={cn(
                    task.status === 'Overdue' && 'bg-critical-light'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTaskIcon(task.type)}
                      <span className="font-medium">{task.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{task.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {task.linkedTo}: {task.linkedId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{format(new Date(task.dueDate), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'HH:mm')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>{task.assignedTo}</TableCell>
                  <TableCell>
                    {task.status !== 'Done' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleComplete(task.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
