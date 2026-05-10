interface PhaseProgressBarProps {
  currentPhase: number;
  totalPhases: number;
  phaseName: string;
  percent: number;
  compact?: boolean;
}

export const PhaseProgressBar = ({ currentPhase, totalPhases, phaseName, percent, compact = false }: PhaseProgressBarProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
          Phase {currentPhase}/{totalPhases} · {phaseName}
        </span>
        <span className={`font-mono font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{percent}%</span>
      </div>
      <div className={`w-full bg-muted rounded-full overflow-hidden ${compact ? 'h-1.5' : 'h-2.5'}`}>
        <div className="flex h-full">
          {Array.from({ length: totalPhases }).map((_, i) => {
            const segWidth = 100 / totalPhases;
            const isDone = i < currentPhase - 1;
            const isActive = i === currentPhase - 1;
            const fillPercent = isDone ? 100 : isActive ? (percent / 100) * 100 : 0;

            return (
              <div key={i} style={{ width: `${segWidth}%` }} className="relative h-full">
                <div
                  className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : isActive ? 'bg-amber-500' : ''}`}
                  style={{ width: `${fillPercent}%` }}
                />
                {i < totalPhases - 1 && (
                  <div className="absolute right-0 top-0 h-full w-px bg-background/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
