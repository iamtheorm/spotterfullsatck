import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flame } from "lucide-react";

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
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex-shrink-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause timeline" : "Play forecast progression"}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 shadow-2xs"
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
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex-shrink-0 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono font-bold text-slate-800 min-w-[50px]">
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
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Valid time & Heatmap Toggle */}
        <div className="flex items-center space-x-2">
          {validTimeFormatted && (
            <span className="text-[11px] font-mono text-slate-500 hidden lg:inline">
              {validTimeFormatted}
            </span>
          )}

          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center space-x-1 ${
              showHeatmap
                ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>{showHeatmap ? "Heatmap Active" : "Heatmap Hidden"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
