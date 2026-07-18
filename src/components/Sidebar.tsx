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

const NavigationItems = ({ activeTab, onTabChange, mobile = false }: SidebarProps & { mobile?: boolean }) => (
  <>
    {navigation.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.key;
      return (
        <button
          aria-current={isActive ? "page" : undefined}
          className={
            mobile
              ? `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition ${
                  isActive ? "bg-mint-100 text-mint-900" : "text-slate-500"
                }`
              : `flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-mint-100 text-mint-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
          }
          key={item.key}
          type="button"
          onClick={() => onTabChange(item.key)}
        >
          <Icon size={mobile ? 19 : 18} />
          <span className="truncate">{item.label}</span>
        </button>
      );
    })}
  </>
);

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => (
  <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 md:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-100 text-mint-800">
          <MapPinned size={23} />
        </div>
        <div>
          <p className="text-lg font-black tracking-tight text-slate-950">Reisplanner</p>
          <p className="text-xs text-slate-500">Plan samen, vertrek gerust</p>
        </div>
      </div>

      <nav aria-label="Hoofdnavigatie" className="mt-9 flex flex-col gap-2">
        <NavigationItems activeTab={activeTab} onTabChange={onTabChange} />
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        <strong className="block text-slate-700">Privé op dit apparaat</strong>
        Je planning en documenten blijven lokaal in deze browser.
      </div>
    </aside>

    <nav
      aria-label="Hoofdnavigatie"
      className="fixed inset-x-3 bottom-3 z-50 flex gap-1 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden"
    >
      <NavigationItems activeTab={activeTab} mobile onTabChange={onTabChange} />
    </nav>
  </>
);
