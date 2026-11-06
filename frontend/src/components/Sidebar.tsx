import React from "react";
import {
  Home,
  MapPin,
  BarChart3,
  History,
  Settings,
  Truck,
} from "lucide-react";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenRules?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = "home",
  onTabChange,
  onOpenRules,
}) => {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "routes", label: "Routes", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-[84px] shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between items-center py-4 px-2 z-20 shadow-2xs select-none">
      {/* Top Section: Brand Icon & Navigation Links */}
      <div className="w-full flex flex-col items-center space-y-6">
        {/* Truck Brand Icon */}
        <div className="w-12 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm hover:scale-105 transition">
          <Truck className="w-6 h-6 text-sky-400" />
        </div>

        {/* Navigation Items */}
        <nav className="w-full flex flex-col items-center space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "settings" && onOpenRules) {
                    onOpenRules();
                  } else if (onTabChange) {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full py-2.5 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card: "Smarter Routes. Safer Journeys." */}
      <div className="w-full px-0.5">
        <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-xs border border-slate-200 group">
          {/* Background image of truck on highway */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80')",
            }}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-2" />
          <div className="relative z-10 p-2 text-white">
            <p className="text-[10px] font-bold leading-tight drop-shadow-sm">
              Smarter Routes.
            </p>
            <p className="text-[10px] font-medium text-slate-200 leading-tight drop-shadow-sm">
              Safer Journeys.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

