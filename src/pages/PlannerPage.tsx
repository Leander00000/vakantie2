import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { CalendarDays, LayoutDashboard, Lightbulb, Route } from "lucide-react";
import type { AppData, TabKey } from "../types";
import { DayTable } from "../components/planner/DayTable";
import { DestinationList } from "../components/planner/DestinationList";
import { TripOverview } from "../components/planner/TripOverview";
import { ActivityIdeas } from "../components/planner/ActivityIdeas";

interface PlannerPageProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  onTabChange: (tab: TabKey) => void;
}

type PlannerView = "overview" | "route" | "days" | "ideas";

const views = [
  { key: "overview" as const, label: "Overzicht", icon: LayoutDashboard },
  { key: "route" as const, label: "Route", icon: Route },
  { key: "days" as const, label: "Dagplanning", icon: CalendarDays },
  { key: "ideas" as const, label: "Ideeën", icon: Lightbulb },
];

export const PlannerPage = ({ data, setData, onTabChange }: PlannerPageProps) => {
  const [view, setView] = useState<PlannerView>("overview");

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Planner</h2>
          <p className="text-sm text-slate-500">Bouw je route en dagplanning zelf op.</p>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex min-w-max">
            {views.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  aria-pressed={view === item.key}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    view === item.key
                      ? "bg-mint-100 text-mint-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key)}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {view === "overview" ? (
        <TripOverview data={data} onPlannerView={setView} onTabChange={onTabChange} />
      ) : null}
      {view === "route" ? <DestinationList data={data} setData={setData} /> : null}
      {view === "days" ? <DayTable data={data} setData={setData} /> : null}
      {view === "ideas" ? <ActivityIdeas data={data} setData={setData} /> : null}
    </section>
  );
};
