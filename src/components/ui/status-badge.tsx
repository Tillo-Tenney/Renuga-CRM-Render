import { cn } from '@/lib/utils';
import { Badge } from './badge';

type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Negotiation' | 'Won' | 'Lost';
type OrderStatus = 'Order Received' | 'In Production' | 'Ready for Delivery' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
type PaymentStatus = 'Pending' | 'Partial' | 'Completed';
type TaskStatus = 'Pending' | 'Done' | 'Overdue';

interface StatusBadgeProps {
  status: LeadStatus | OrderStatus | PaymentStatus | TaskStatus;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  // Lead statuses
  New: { bg: 'bg-info-light', text: 'text-info', border: 'border-blue-200' },
  Contacted: { bg: 'bg-primary-light', text: 'text-primary', border: 'border-primary/30' },
  Quoted: { bg: 'bg-warning-light', text: 'text-yellow-800', border: 'border-yellow-300' },
  Negotiation: { bg: 'bg-orange-light', text: 'text-orange', border: 'border-orange/30' },
  Won: { bg: 'bg-success-light', text: 'text-success', border: 'border-green-300' },
  Lost: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  
  // Order statuses
  'Order Received': { bg: 'bg-info-light', text: 'text-info', border: 'border-blue-200' },
  'In Production': { bg: 'bg-warning-light', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Ready for Delivery': { bg: 'bg-orange-light', text: 'text-orange', border: 'border-orange/30' },
  'Out for Delivery': { bg: 'bg-primary-light', text: 'text-primary', border: 'border-primary/30' },
  Delivered: { bg: 'bg-success-light', text: 'text-success', border: 'border-green-300' },
  Cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  
  // Payment statuses
  Pending: { bg: 'bg-warning-light', text: 'text-yellow-800', border: 'border-yellow-300' },
  Partial: { bg: 'bg-orange-light', text: 'text-orange', border: 'border-orange/30' },
  Completed: { bg: 'bg-success-light', text: 'text-success', border: 'border-green-300' },
  
  // Task statuses
  Done: { bg: 'bg-success-light', text: 'text-success', border: 'border-green-300' },
  Overdue: { bg: 'bg-critical-light', text: 'text-destructive', border: 'border-red-300' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const styles = statusStyles[status] || statusStyles.Pending;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {status}
    </Badge>
  );
};
