import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, Flame } from "lucide-react";

interface ForecastSliderProps {
  forecastHour: number;
  onHourChange: React.Dispatch<React.SetStateAction<number>> | ((hour: number) => void);
  validTimeFormatted?: string;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  isLoadingCorridor?: boolean;
}

export const ForecastSlider: React.FC<ForecastSliderProps> = ({
  forecastHour,
  onHourChange,
  validTimeFormatted,
  showHeatmap,
  onToggleHeatmap,
  isLoadingCorridor,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (typeof onHourChange === "function") {
          (onHourChange as React.Dispatch<React.SetStateAction<number>>)((prev: number) => {
            if (prev >= 48) {
              setIsPlaying(false);
              return 48;
            }
            return prev + 3;
          });
        }
      }, 1100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, onHourChange]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause timeline" : "Play forecast progression"}
            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              (onHourChange as any)(0);
            }}
            title="Reset to departure time"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex-shrink-0 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono font-semibold text-slate-200 min-w-[50px]">
            +{forecastHour}h
          </span>
        </div>

        {/* Range Slider */}
        <div className="flex-1 max-w-md mx-2">
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => {
              setIsPlaying(false);
              (onHourChange as any)(parseInt(e.target.value, 10));
            }}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Status & Toggle */}
        <div className="flex items-center space-x-2">
          {validTimeFormatted && (
            <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
              {validTimeFormatted}
            </span>
          )}

          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center space-x-1 ${
              showHeatmap
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{showHeatmap ? "Heatmap On" : "Heatmap Off"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
