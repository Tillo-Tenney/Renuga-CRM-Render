import { cn } from '@/lib/utils';
import { Badge } from './badge';

interface AgingBadgeProps {
  bucket: 'Fresh' | 'Warm' | 'At Risk' | 'Critical';
  days?: number;
  showDays?: boolean;
  className?: string;
}

const bucketStyles = {
  Fresh: {
    bg: 'bg-fresh-light',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  Warm: {
    bg: 'bg-warm-light',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  'At Risk': {
    bg: 'bg-atrisk-light',
    text: 'text-orange-700',
    border: 'border-orange-300',
  },
  Critical: {
    bg: 'bg-critical-light',
    text: 'text-red-700',
    border: 'border-red-300',
  },
};

export const AgingBadge = ({ bucket, days, showDays = true, className }: AgingBadgeProps) => {
  const styles = bucketStyles[bucket];

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
      {bucket}
      {showDays && days !== undefined && ` (${days}d)`}
    </Badge>
  );
};
