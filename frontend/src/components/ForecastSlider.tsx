import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, CloudRain, Flame } from "lucide-react";

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
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, onHourChange]);

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Corridor Weather Forecast Evolution
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-mono">
            +{forecastHour}h Offset
          </span>
          {isLoadingCorridor && (
            <span className="text-[10px] text-amber-400 animate-pulse">
              Updating forecast...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Layer toggle button */}
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center space-x-1.5 ${
              showHeatmap
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{showHeatmap ? "Heatmap Active" : "Heatmap Hidden"}</span>
          </button>

          {/* Valid time preview */}
          {validTimeFormatted && (
            <span className="text-xs font-mono text-slate-300 hidden md:inline">
              {validTimeFormatted}
            </span>
          )}
        </div>
      </div>

      {/* Slider and playback controls */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause timeline" : "Play timeline"}
          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex-shrink-0 shadow"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onHourChange(0);
          }}
          title="Reset to departure time (0h)"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex-shrink-0 border border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => {
              setIsPlaying(false);
              onHourChange(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono font-bold text-slate-200 w-12 text-right">
          +{forecastHour}h
        </span>
      </div>

      {/* Markers along timeline */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-14">
        <span>0h (Dep)</span>
        <span>+12h</span>
        <span>+24h (Day 1)</span>
        <span>+36h</span>
        <span>+48h (Day 2)</span>
      </div>
    </div>
  );
};
