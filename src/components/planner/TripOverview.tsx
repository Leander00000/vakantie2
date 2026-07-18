import {
  ArrowRight,
  Banknote,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  FileText,
  Lightbulb,
  Luggage,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "../../data/emptyTrip";
import type { AppData, TabKey } from "../../types";

type PlannerView = "overview" | "route" | "days" | "ideas";

interface TripOverviewProps {
  data: AppData;
  onPlannerView: (view: PlannerView) => void;
  onTabChange: (tab: TabKey) => void;
}

interface NextStep {
  id: string;
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}

const percentage = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export const TripOverview = ({ data, onPlannerView, onTabChange }: TripOverviewProps) => {
  const trip = data.trip;
  if (!trip) return null;

  const plannedDays = data.dayPlans.filter((day) => day.status !== "leeg").length;
  const definitiveDays = data.dayPlans.filter((day) => day.status === "definitief").length;
  const packedItems = data.packingItems.filter((item) => item.packed).length;
  const totalCosts = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidCosts = data.expenses
    .filter((expense) => expense.paidStatus === "betaald")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const bookingItems = [
    ...data.transports.map((item) => ({ status: item.status })),
    ...data.destinations
      .filter((destination) => destination.accommodationStatus !== "niet van toepassing")
      .map((item) => ({ status: item.accommodationStatus })),
  ];
  const confirmedBookings = bookingItems.filter((item) =>
    ["geboekt", "betaald"].includes(item.status)
  ).length;

  const bookedWithoutDocument =
    data.transports.filter(
      (transport) =>
        ["geboekt", "betaald"].includes(transport.status) &&
        !data.documents.some(
          (document) =>
            document.linkedTransportId === transport.id || transport.documentIds.includes(document.id)
        )
    ).length +
    data.destinations.filter(
      (destination) =>
        ["geboekt", "betaald"].includes(destination.accommodationStatus) &&
        !data.documents.some((document) => document.linkedDestinationId === destination.id)
    ).length;

  const nextSteps: NextStep[] = [];
  if (data.destinations.length === 0) {
    nextSteps.push({
      id: "destination",
      title: "Bouw je route op",
      detail: "Voeg je eerste bestemming of tussenstop toe.",
      action: "Naar route",
      onClick: () => onPlannerView("route"),
    });
  }
  if (data.dayPlans.some((day) => day.status === "leeg")) {
    nextSteps.push({
      id: "days",
      title: "Vul je dagen verder in",
      detail: `${data.dayPlans.length - plannedDays} van de ${data.dayPlans.length} dagen zijn nog leeg.`,
      action: "Naar dagen",
      onClick: () => onPlannerView("days"),
    });
  }
  if (data.activities.length === 0) {
    nextSteps.push({
      id: "ideas",
      title: "Bewaar activiteitenideeën",
      detail: "Maak eerst een shortlist; plan ideeën later pas op een dag.",
      action: "Idee toevoegen",
      onClick: () => onPlannerView("ideas"),
    });
  }
  if (bookingItems.some((item) => !["geboekt", "betaald"].includes(item.status))) {
    nextSteps.push({
      id: "bookings",
      title: "Controleer open boekingen",
      detail: `${bookingItems.length - confirmedBookings} onderdelen zijn nog niet geboekt.`,
      action: "Bekijk route",
      onClick: () => onPlannerView("route"),
    });
  }
  if (bookedWithoutDocument > 0) {
    nextSteps.push({
      id: "documents",
      title: "Voeg boekingsdocumenten toe",
      detail: `${bookedWithoutDocument} bevestiging(en) missen nog een document.`,
      action: "Naar documenten",
      onClick: () => onTabChange("documents"),
    });
  }
  if (data.expenses.length === 0) {
    nextSteps.push({
      id: "budget",
      title: "Start je budget",
      detail: "Leg je eerste verwachte of betaalde kostenpost vast.",
      action: "Naar budget",
      onClick: () => onTabChange("budget"),
    });
  }
  if (data.packingItems.length === 0) {
    nextSteps.push({
      id: "packing",
      title: "Maak een paklijst",
      detail: "Voeg per categorie losse items of een hele lijst toe.",
      action: "Naar paklijst",
      onClick: () => onTabChange("packing"),
    });
  }

  const sections = [
    {
      label: "Route",
      value: `${data.destinations.length} stops`,
      detail: `${data.transports.length} verplaatsingen`,
      progress: data.destinations.length > 0 ? Math.min(100, data.destinations.length * 25) : 0,
      icon: Route,
      onClick: () => onPlannerView("route"),
    },
    {
      label: "Dagplanning",
      value: `${plannedDays}/${data.dayPlans.length} gepland`,
      detail: `${definitiveDays} definitief`,
      progress: percentage(plannedDays, data.dayPlans.length),
      icon: CalendarCheck2,
      onClick: () => onPlannerView("days"),
    },
    {
      label: "Boekingen",
      value: `${confirmedBookings}/${bookingItems.length || 0} bevestigd`,
      detail: bookedWithoutDocument ? `${bookedWithoutDocument} zonder document` : "Documenten op orde",
      progress: percentage(confirmedBookings, bookingItems.length),
      icon: CheckCircle2,
      onClick: () => onPlannerView("route"),
    },
    {
      label: "Paklijst",
      value: `${packedItems}/${data.packingItems.length || 0} ingepakt`,
      detail: `${data.packingItems.filter((item) => item.essential && !item.packed).length} essentieel open`,
      progress: percentage(packedItems, data.packingItems.length),
      icon: Luggage,
      onClick: () => onTabChange("packing"),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-mint-200 bg-gradient-to-br from-mint-50 via-white to-sky-50 p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-mint-800 shadow-sm">
              <Sparkles size={14} /> Jouw reis in opbouw
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {trip.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {trip.notes || "Van eerste idee tot vertrek: houd route, dagen, kosten en boekingen op één plek bij."}
            </p>
            {data.destinations.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                {data.destinations.slice(0, 5).map((destination, index) => (
                  <span className="inline-flex items-center gap-2" key={destination.id}>
                    {index > 0 ? <ArrowRight className="text-slate-300" size={14} /> : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
                      <MapPin size={13} className="text-mint-700" />
                      {destination.name}
                    </span>
                  </span>
                ))}
                {data.destinations.length > 5 ? (
                  <span className="text-slate-500">+{data.destinations.length - 5}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid min-w-64 grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <Banknote size={18} className="text-mint-700" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kosten</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(totalCosts, trip.currency)}
              </p>
              <p className="text-xs text-slate-500">{formatMoney(paidCosts, trip.currency)} betaald</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <FileText size={18} className="text-sky-700" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Documenten</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{data.documents.length}</p>
              <p className="text-xs text-slate-500">lokaal bewaard</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Voortgang</h3>
            <p className="text-sm text-slate-500">Klik op een onderdeel om verder te plannen.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button className="panel text-left transition hover:-translate-y-0.5 hover:border-mint-300" key={section.label} type="button" onClick={section.onClick}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-bold text-mint-700">{section.progress}%</span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{section.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{section.value}</p>
                <p className="mt-1 text-xs text-slate-500">{section.detail}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${section.progress}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <CircleAlert size={19} />
            </span>
            <div>
              <h3 className="font-bold text-slate-950">Volgende stappen</h3>
              <p className="text-sm text-slate-500">Automatisch afgeleid uit wat je zelf hebt ingevuld.</p>
            </div>
          </div>

          {nextSteps.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-100">
              {nextSteps.slice(0, 5).map((step) => (
                <button className="group flex w-full items-center justify-between gap-4 py-3 text-left" key={step.id} type="button" onClick={step.onClick}>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{step.detail}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-mint-700">
                    {step.action} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Alles ziet er compleet uit. Een laatste gezamenlijke controle en jullie kunnen gaan.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Lightbulb size={19} />
            </span>
            <div>
              <h3 className="font-bold text-slate-950">Ideeënbak</h3>
              <p className="text-sm text-slate-500">Bewaar opties zonder je dagplanning meteen vast te zetten.</p>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-3xl font-bold text-slate-950">{data.activities.length}</p>
              <p className="text-sm text-slate-500">
                {data.activities.filter((activity) => activity.priority === "must-do").length} must-do
              </p>
            </div>
            <button className="btn-secondary" type="button" onClick={() => onPlannerView("ideas")}>
              Bekijk ideeën <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
