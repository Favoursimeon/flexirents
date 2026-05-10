import { Badge } from "@/components/ui/badge";

interface ProjectStatusBadgeProps {
  status: 'active' | 'hold' | 'complete';
  className?: string;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400' },
  hold: { label: 'On Hold', className: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400' },
  complete: { label: 'Completed', className: 'bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-400' },
};

export const ProjectStatusBadge = ({ status, className = '' }: ProjectStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs ${className}`}>
      {config.label}
    </Badge>
  );
};
