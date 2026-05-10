import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Phase {
  number: number;
  name: string;
  status: 'done' | 'active' | 'pending';
  percent_complete: number;
  payment_trigger?: string;
}

interface PhaseTimelineProps {
  phases: Phase[];
  compact?: boolean;
}

export const PhaseTimeline = ({ phases, compact = false }: PhaseTimelineProps) => {
  return (
    <div className="space-y-0">
      {phases.map((phase, i) => {
        const isDone = phase.status === 'done';
        const isActive = phase.status === 'active';

        return (
          <div key={phase.number} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center rounded-full border-2 ${compact ? 'w-6 h-6' : 'w-8 h-8'} ${
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                isActive ? 'bg-amber-500 border-amber-500 text-white' :
                'bg-muted border-muted-foreground/30 text-muted-foreground/50'
              }`}>
                {isDone ? <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} /> :
                  <span className={`font-mono font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>{phase.number}</span>
                }
              </div>
              {i < phases.length - 1 && (
                <div className={`w-0.5 ${compact ? 'h-6' : 'h-10'} ${isDone ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
              )}
            </div>
            {/* Content */}
            <div className={`${compact ? 'pb-3' : 'pb-5'} flex-1`}>
              <div className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
                isDone ? 'text-foreground' : isActive ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/50'
              }`}>
                {phase.name}
              </div>
              {isActive && !compact && (
                <div className="mt-1.5">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${phase.percent_complete}%` }} />
                  </div>
                  {phase.payment_trigger && (
                    <div className="mt-2 text-xs px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      💰 {phase.payment_trigger}
                    </div>
                  )}
                </div>
              )}
              {isDone && !compact && (
                <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Complete</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
