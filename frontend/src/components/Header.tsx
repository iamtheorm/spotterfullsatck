import React from "react";

interface HeaderProps {
  onOpenRules?: () => void;
  onSelectPreset?: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white border-b border-slate-200/80 relative z-30 select-none">
      {/* Main Header Banner */}
      <div className="relative h-20 md:h-22 px-6 flex items-center justify-between overflow-hidden bg-white">
        {/* Left Side: Truck Logo + Title + "Plan smarter. Deliver safer." with orange brush stroke */}
        <div className="flex items-center space-x-4 z-10 py-2">
          {/* Modern vector truck silhouette logo */}
          <div className="w-12 h-10 flex items-center justify-center text-slate-900">
            <svg
              className="w-11 h-9 text-[#1e293b]"
              viewBox="0 0 48 36"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Truck Cabin & Trailer Silhouette */}
              <path d="M4 10C4 8.89543 4.89543 8 6 8H26C27.1046 8 28 8.89543 28 10V26H4V10Z" />
              <path d="M29 14H35.5C36.2956 14 37.0587 14.3161 37.6213 14.8787L43.1213 20.3787C43.6839 20.9413 44 21.7044 44 22.5V26H29V14Z" />
              <circle cx="12" cy="27" r="4" fill="#0f172a" />
              <circle cx="12" cy="27" r="1.8" fill="#ffffff" />
              <circle cx="36" cy="27" r="4" fill="#0f172a" />
              <circle cx="36" cy="27" r="1.8" fill="#ffffff" />
              {/* Speed motion lines */}
              <rect x="0" y="12" width="2.5" height="1.5" rx="0.75" />
              <rect x="0" y="16" width="3" height="1.5" rx="0.75" />
              <rect x="0" y="20" width="2" height="1.5" rx="0.75" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl md:text-[22px] font-black text-slate-900 tracking-tight font-sans">
              Weather-Aware Truck Routing
            </h1>
            <div className="relative inline-block mt-0.5">
              <p className="text-xs md:text-sm font-medium text-slate-600">
                Plan smarter. Deliver safer.
              </p>
              {/* Orange brush curved underline under "safer" */}
              <svg
                className="absolute -bottom-1.5 right-0 w-28 h-2.5 text-amber-500 overflow-visible"
                viewBox="0 0 110 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8C35 2 75 3 108 7"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Panoramic Truck on Highway */}
        <div className="absolute top-0 right-0 h-full w-3/5 md:w-1/2 flex items-center justify-end pointer-events-none">
          {/* Panoramic truck background photo with soft linear gradient fade */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80')",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%)",
            }}
          />
        </div>
      </div>
    </header>
  );
};
