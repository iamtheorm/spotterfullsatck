import React from "react";
import bannerImg from "../assets/header-banner.jpg";

interface HeaderProps {
  onOpenRules?: () => void;
  onSelectPreset?: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="w-full bg-[#f8f7fc] border-b border-slate-200/90 relative z-30 select-none overflow-hidden shrink-0">
      <div className="w-full h-20 md:h-[88px]">
        <img
          src={bannerImg}
          alt="Weather-Aware Truck Routing - Plan smarter. Deliver safer."
          className="w-full h-full object-cover object-left"
        />
      </div>
    </header>
  );
};
