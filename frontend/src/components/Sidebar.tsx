import React from "react";
import {
  Home,
  MapPin,
  BarChart2,
  History,
  Settings,
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
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-[88px] shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between items-center py-5 px-2.5 z-20 shadow-xs select-none">
      {/* Navigation Links */}
      <nav className="w-full flex flex-col items-center space-y-3">
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
              className={`w-full py-3 px-1 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition ${
                isActive
                  ? "bg-[#e0f2fe] text-[#0369a1] font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#0284c7]" : "text-slate-500"}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Promo Card: "Smarter Routes. Safer Journeys." */}
      <div className="w-full px-1">
        <div className="relative w-full h-36 rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-2.5" />
          <div className="relative z-10 p-1.5 text-white">
            <p className="text-[10px] font-bold leading-tight drop-shadow-sm text-white">
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
