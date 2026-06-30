import { AlertTriangle, CalendarRange, Coins, FileArchive, Moon, WalletCards } from "lucide-react";
import { daysBetween, formatDate, formatMoney } from "../data/emptyTrip";
import type { AppData } from "../types";

interface HeaderProps {
  data: AppData;
  onNewTrip: () => void;
  onReset: () => void;
  onExport: () => void;
  onImportClick: () => void;
}

export const Header = ({ data, onNewTrip, onReset, onExport, onImportClick }: HeaderProps) => {
  const { trip } = data;
  const totalCosts = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const openExpenses = data.expenses.filter((expense) => expense.paidStatus !== "betaald").length;
  const bookedWithoutDocs =
    data.transports.filter((transport) => transport.status === "geboekt" && transport.documentIds.length === 0)
      .length +
    data.destinations.filter(
      (destination) =>
        destination.accommodationStatus === "geboekt" &&
        !data.documents.some((document) => document.linkedDestinationId === destination.id)
    ).length;
  const openBookings = openExpenses + bookedWithoutDocs;

  const stats = [
    {
      label: "Datumrange",
      value: trip ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}` : "-",
      icon: CalendarRange,
    },
    {
      label: "Nachten",
      value: trip ? `${daysBetween(trip.startDate, trip.endDate)}` : "0",
      icon: Moon,
    },
    {
      label: "Totale kosten",
      value: formatMoney(totalCosts, trip?.currency ?? "EUR"),
      icon: Coins,
    },
    {
      label: "Openstaand",
      value: `${openBookings}`,
      icon: AlertTriangle,
    },
    {
      label: "Documenten",
      value: `${data.documents.length}`,
      icon: FileArchive,
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-mint-700">Reisoverzicht</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {trip?.name || "Nieuwe reis plannen"}
            </h1>
            {trip?.notes ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{trip.notes}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={onImportClick}>
              Import JSON
            </button>
            <button className="btn-secondary" type="button" onClick={onExport} disabled={!trip}>
              Export JSON
            </button>
            <button className="btn-secondary" type="button" onClick={onNewTrip}>
              Nieuwe reis starten
            </button>
            <button className="btn-danger" type="button" onClick={onReset}>
              Reset alle data
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" key={stat.label}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Icon size={15} />
                  {stat.label}
                </div>
                <p className="mt-1 break-words text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {trip?.totalBudget ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-mint-50 px-4 py-3 text-sm text-mint-900">
            <WalletCards size={17} />
            Totaalbudget: {formatMoney(trip.totalBudget, trip.currency)}
          </div>
        ) : null}
      </div>
    </header>
  );
};
