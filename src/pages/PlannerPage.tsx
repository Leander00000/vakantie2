import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { CalendarDays, Route } from "lucide-react";
import type { AppData } from "../types";
import { DayTable } from "../components/planner/DayTable";
import { DestinationList } from "../components/planner/DestinationList";

interface PlannerPageProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

type PlannerView = "route" | "days";

export const PlannerPage = ({ data, setData }: PlannerPageProps) => {
  const [view, setView] = useState<PlannerView>("route");

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Planner</h2>
          <p className="text-sm text-slate-500">Bouw je route en dagplanning zelf op.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
              view === "route" ? "bg-mint-100 text-mint-900" : "text-slate-600 hover:bg-slate-50"
            }`}
            type="button"
            onClick={() => setView("route")}
          >
            <Route size={16} />
            Route-overzicht
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
              view === "days" ? "bg-mint-100 text-mint-900" : "text-slate-600 hover:bg-slate-50"
            }`}
            type="button"
            onClick={() => setView("days")}
          >
            <CalendarDays size={16} />
            Dag-tot-dag
          </button>
        </div>
      </div>

      {view === "route" ? <DestinationList data={data} setData={setData} /> : null}
      {view === "days" ? <DayTable data={data} setData={setData} /> : null}
    </section>
  );
};
