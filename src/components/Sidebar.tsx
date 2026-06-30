import { Banknote, CalendarDays, FileText, Luggage, MapPinned } from "lucide-react";
import type { TabKey } from "../types";

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const navigation = [
  { key: "planner" as const, label: "Planner", icon: CalendarDays },
  { key: "budget" as const, label: "Budget", icon: Banknote },
  { key: "packing" as const, label: "Paklijst", icon: Luggage },
  { key: "documents" as const, label: "Documenten", icon: FileText },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => (
  <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white px-4 py-4 md:fixed md:inset-y-0 md:left-0 md:w-72 md:border-b-0 md:border-r md:px-5 md:py-6">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-100 text-mint-800">
        <MapPinned size={23} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-950">Reisplanner</p>
        <p className="text-xs text-slate-500">Lokale reisorganisatie</p>
      </div>
    </div>

    <nav className="mt-5 grid grid-cols-2 gap-2 md:mt-8 md:flex md:flex-col">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
              isActive
                ? "bg-mint-100 text-mint-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>

    <div className="mt-auto hidden rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:block">
      Alle reisdata blijft in deze browser opgeslagen.
    </div>
  </aside>
);
