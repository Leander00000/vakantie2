import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  BedDouble,
  CalendarDays,
  Edit2,
  FileText,
  MapPin,
  Plus,
  Route,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatMoney } from "../../data/emptyTrip";
import type { AppData, DayPlan, DayStatus } from "../../types";
import { DayForm } from "./DayForm";

interface DayTableProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

type DayFilter = "alles" | DayStatus;

const weekday = (date: string) =>
  new Intl.DateTimeFormat("nl-NL", { weekday: "long" }).format(new Date(`${date}T00:00:00`));

export const DayTable = ({ data, setData }: DayTableProps) => {
  const [editingDay, setEditingDay] = useState<DayPlan | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DayFilter>("alles");

  const updateDay = (day: DayPlan) => {
    setData((current) => {
      const validTransportIds = new Set(current.transports.map((item) => item.id));
      const validActivityIds = new Set(current.activities.map((item) => item.id));
      const validDocumentIds = new Set(current.documents.map((item) => item.id));
      const validExpenseIds = new Set(current.expenses.map((item) => item.id));
      const documentIds = Array.from(
        new Set(day.documentIds.filter((documentId) => validDocumentIds.has(documentId)))
      );
      const expenseIds = Array.from(
        new Set(day.expenseIds.filter((expenseId) => validExpenseIds.has(expenseId)))
      );
      const selectedDocumentIds = new Set(documentIds);
      const selectedExpenseIds = new Set(expenseIds);
      const transportIds = Array.from(
        new Set(day.transportIds.filter((transportId) => validTransportIds.has(transportId)))
      );
      const activityIds = Array.from(
        new Set(day.activityIds.filter((activityId) => validActivityIds.has(activityId)))
      );
      const hasMeaningfulContent = Boolean(
        day.location.trim() ||
          day.dayType ||
          transportIds.length ||
          activityIds.length ||
          day.accommodation.trim() ||
          day.activities.trim() ||
          day.meals.trim() ||
          Number(day.estimatedCost) > 0 ||
          day.bookingStatus !== "geen" ||
          documentIds.length ||
          expenseIds.length ||
          day.notes.trim()
      );
      const normalizedDay: DayPlan = {
        ...day,
        transportIds,
        activityIds,
        documentIds,
        expenseIds,
        status: day.status === "leeg" && hasMeaningfulContent ? "concept" : day.status,
      };

      return {
        ...current,
        dayPlans: current.dayPlans.map((item) =>
          item.id === day.id
            ? normalizedDay
            : {
                ...item,
                documentIds: item.documentIds.filter(
                  (documentId) => !selectedDocumentIds.has(documentId)
                ),
                expenseIds: item.expenseIds.filter(
                  (expenseId) => !selectedExpenseIds.has(expenseId)
                ),
              }
        ),
        documents: current.documents.map((document) => {
          if (selectedDocumentIds.has(document.id)) {
            return { ...document, linkedDayId: day.id };
          }
          if (document.linkedDayId === day.id) return { ...document, linkedDayId: "" };
          return document;
        }),
        expenses: current.expenses.map((expense) => {
          if (selectedExpenseIds.has(expense.id)) return { ...expense, dayId: day.id };
          if (expense.dayId === day.id) return { ...expense, dayId: "" };
          return expense;
        }),
        activities: current.activities.map((activity) =>
          normalizedDay.activityIds.includes(activity.id) && activity.status !== "geboekt"
            ? { ...activity, status: "gepland" }
            : activity
        ),
      };
    });
    setEditingDay(null);
  };

  const filteredDays = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.dayPlans.filter((day) => {
      const statusMatches = filter === "alles" || day.status === filter;
      const haystack = [day.location, day.activities, day.accommodation, day.meals, day.notes]
        .join(" ")
        .toLowerCase();
      return statusMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [data.dayPlans, filter, query]);

  const nextEmptyDay = data.dayPlans.find((day) => day.status === "leeg");

  if (data.dayPlans.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nog geen dagen gegenereerd"
        description="Maak eerst een reis met start- en einddatum aan."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Dagplanning</h2>
          <p className="text-sm text-slate-500">
            Je dagen staan klaar als lege tijdlijn. Vul alleen in wat je al weet.
          </p>
        </div>
        {nextEmptyDay ? (
          <button className="btn-primary" type="button" onClick={() => setEditingDay(nextEmptyDay)}>
            <Plus size={16} />
            Volgende lege dag invullen
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label>
          <span className="label">Zoeken in planning</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="input pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Locatie, activiteit of notitie"
            />
          </div>
        </label>
        <label>
          <span className="label">Dagstatus</span>
          <select className="input mt-1" value={filter} onChange={(event) => setFilter(event.target.value as DayFilter)}>
            <option value="alles">Alle dagen</option>
            <option value="leeg">Leeg</option>
            <option value="concept">Concept</option>
            <option value="gepland">Gepland</option>
            <option value="definitief">Definitief</option>
          </select>
        </label>
      </div>

      {editingDay ? (
        <div className="scroll-mt-4" id="day-editor">
          <DayForm data={data} day={editingDay} onCancel={() => setEditingDay(null)} onSubmit={updateDay} />
        </div>
      ) : null}

      {filteredDays.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Geen dagen gevonden met deze zoekterm of status.
        </div>
      ) : (
        <div className="relative space-y-3 before:absolute before:bottom-8 before:left-[30px] before:top-8 before:w-px before:bg-slate-200 sm:before:left-[43px]">
          {filteredDays.map((day) => {
            const transports = data.transports.filter((transport) => day.transportIds.includes(transport.id));
            const linkedExpenses = data.expenses.filter((expense) => day.expenseIds.includes(expense.id));
            const linkedActivities = data.activities.filter((activity) => day.activityIds.includes(activity.id));
            const linkedCost = linkedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            const hasContent = Boolean(
              day.location ||
                day.activities ||
                linkedActivities.length ||
                day.accommodation ||
                day.meals ||
                day.notes ||
                transports.length
            );

            return (
              <article className="relative grid grid-cols-[60px_1fr] gap-3 sm:grid-cols-[86px_1fr]" key={day.id}>
                <div className="relative z-10 flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm sm:h-[72px] sm:w-[72px]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Dag</span>
                  <span className="text-xl font-black leading-none text-slate-900 sm:text-2xl">{day.dayNumber}</span>
                </div>

                <div className={`rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${day.status === "leeg" ? "border-dashed border-slate-300" : "border-slate-200 hover:border-mint-300"}`}>
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold capitalize text-slate-950">{weekday(day.date)}</p>
                        <span className="text-sm text-slate-400">·</span>
                        <p className="text-sm text-slate-500">{formatDate(day.date)}</p>
                        <StatusBadge status={day.status} />
                        {day.dayType ? <StatusBadge status={day.dayType} /> : null}
                      </div>
                      <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-950">
                        <MapPin size={17} className="shrink-0 text-mint-700" />
                        {day.location || (hasContent ? "Locatie nog kiezen" : "Nog niets gepland")}
                      </h3>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {day.estimatedCost || linkedCost ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                          {formatMoney(day.estimatedCost || linkedCost, data.trip?.currency)}
                        </span>
                      ) : null}
                      {day.documentIds.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                          <FileText size={13} /> {day.documentIds.length}
                        </span>
                      ) : null}
                      <button className="btn-secondary" type="button" onClick={() => setEditingDay(day)}>
                        <Edit2 size={15} /> {hasContent ? "Bewerken" : "Invullen"}
                      </button>
                    </div>
                  </div>

                  {hasContent ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {transports.length ? (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <Route size={14} /> Vervoer
                          </p>
                          <p className="mt-1.5 text-sm text-slate-700">
                            {transports.map((transport) => `${transport.from} → ${transport.to}`).join(", ")}
                          </p>
                        </div>
                      ) : null}
                      {day.accommodation ? (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <BedDouble size={14} /> Verblijf
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-sm text-slate-700">{day.accommodation}</p>
                        </div>
                      ) : null}
                      {day.activities || linkedActivities.length ? (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <Sparkles size={14} /> Activiteiten
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-sm text-slate-700">
                            {[linkedActivities.map((activity) => activity.title).join(", "), day.activities]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      ) : null}
                      {day.meals ? (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <Utensils size={14} /> Eten
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-sm text-slate-700">{day.meals}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Deze dag is bewust leeg. Voeg pas details toe zodra jullie iets hebben besloten.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
