import {
  CalendarRange,
  Check,
  ChevronDown,
  CircleAlert,
  Coins,
  Download,
  FileArchive,
  MoreHorizontal,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Upload,
  Users,
} from "lucide-react";
import { daysBetween, formatDate, formatMoney } from "../data/emptyTrip";
import type { AppData } from "../types";

type SaveState = "saved" | "saving" | "error";

interface HeaderProps {
  data: AppData;
  saveState: SaveState;
  onEditTrip: () => void;
  onNewTrip: () => void;
  onReset: () => void;
  onExport: () => void;
  onImportClick: () => void;
}

const saveLabel = {
  saved: "Lokaal opgeslagen",
  saving: "Opslaan…",
  error: "Opslaan mislukt",
} satisfies Record<SaveState, string>;

export const Header = ({
  data,
  saveState,
  onEditTrip,
  onNewTrip,
  onReset,
  onExport,
  onImportClick,
}: HeaderProps) => {
  const { trip } = data;
  const totalCosts = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const plannedDays = data.dayPlans.filter((day) => day.status !== "leeg").length;
  const bookable =
    data.transports.length +
    data.destinations.filter((destination) => destination.accommodationStatus !== "niet van toepassing").length;
  const confirmed =
    data.transports.filter((transport) => ["geboekt", "betaald"].includes(transport.status)).length +
    data.destinations.filter((destination) =>
      ["geboekt", "betaald"].includes(destination.accommodationStatus)
    ).length;

  return (
    <header className="relative z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur md:sticky md:top-0">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-mint-700">Reisplanner</p>
              <span
                aria-live="polite"
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                  saveState === "error"
                    ? "bg-rose-50 text-rose-700"
                    : saveState === "saving"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                }`}
                role="status"
              >
                {saveState === "error" ? <CircleAlert size={12} /> : <Check size={12} />}
                {saveLabel[saveState]}
              </span>
            </div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">
              {trip?.name || "Nieuwe reis plannen"}
            </h1>
            {trip ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange size={15} /> {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Moon size={15} /> {daysBetween(trip.startDate, trip.endDate)} nachten
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} /> {trip.travelers} {trip.travelers === 1 ? "reiziger" : "reizigers"}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trip ? (
              <button className="btn-primary" type="button" onClick={onEditTrip}>
                <Pencil size={15} /> Reis bewerken
              </button>
            ) : null}

            <details className="relative">
              <summary className="btn-secondary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <MoreHorizontal size={17} /> Beheer <ChevronDown size={14} />
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <button className="menu-item" type="button" onClick={onImportClick}>
                  <Upload size={16} /> Back-up importeren
                </button>
                <button className="menu-item" type="button" onClick={onExport} disabled={!trip}>
                  <Download size={16} /> Back-up downloaden
                </button>
                <div className="my-2 border-t border-slate-100" />
                <button className="menu-item" type="button" onClick={onNewTrip}>
                  <Plus size={16} /> Nieuwe reis starten
                </button>
                <button className="menu-item text-rose-700 hover:bg-rose-50" type="button" onClick={onReset}>
                  <RotateCcw size={16} /> Alle lokale data wissen
                </button>
              </div>
            </details>
          </div>
        </div>

        {trip ? (
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="header-stat">
              <Coins size={15} />
              <span><strong>{formatMoney(totalCosts, trip.currency)}</strong> uitgegeven</span>
            </div>
            <div className="header-stat">
              <CalendarRange size={15} />
              <span><strong>{plannedDays}/{data.dayPlans.length}</strong> dagen gepland</span>
            </div>
            <div className="header-stat">
              <Check size={15} />
              <span><strong>{confirmed}/{bookable}</strong> boekingen rond</span>
            </div>
            <div className="header-stat">
              <FileArchive size={15} />
              <span><strong>{data.documents.length}</strong> documenten</span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};
