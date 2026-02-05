import PropTypes from "prop-types";
import { Truck } from "lucide-react";
import { PIPELINE_STAGES } from "../utils/pipelineStages";
import { cn } from "../lib/utils";

const PipelineStatusBar = ({ currentStage, onStageSelect, compact = false }) => {
  const stages = PIPELINE_STAGES;
  const currentIndex = Math.max(0, stages.findIndex((stage) => stage.key === currentStage));
  const progressPercent = stages.length > 1 ? (currentIndex / (stages.length - 1)) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative h-3 rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-3 rounded-full bg-primary/70 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        <Truck
          className="absolute -top-3 h-6 w-6 text-primary transition-all"
          style={{ left: `calc(${progressPercent}% - 12px)` }}
        />
      </div>
      {!compact && (
        <div className="mt-4 grid grid-cols-7 gap-2 text-[11px]">
          {stages.map((stage, index) => {
            const isActive = stage.key === currentStage;
            const isReached = index <= currentIndex;
            const tone =
              stage.tone === "danger"
                ? "text-rose-600"
                : stage.tone === "success"
                  ? "text-emerald-600"
                  : "text-muted-foreground";

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onStageSelect?.(stage.key)}
                className={cn(
                  "rounded-md border border-border px-2 py-1 text-center transition hover:bg-muted/60",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isActive && isReached && "text-foreground"
                )}
              >
                <span className={cn("block text-[10px] uppercase tracking-wide", tone)}>
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

PipelineStatusBar.propTypes = {
  currentStage: PropTypes.string,
  onStageSelect: PropTypes.func,
  compact: PropTypes.bool,
};

export default PipelineStatusBar;
