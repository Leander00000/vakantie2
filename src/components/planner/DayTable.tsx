import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { CalendarDays, Edit2 } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatMoney } from "../../data/emptyTrip";
import type { AppData, DayPlan } from "../../types";
import { DayForm } from "./DayForm";

interface DayTableProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

const preview = (value: string) => value.trim() || "-";

export const DayTable = ({ data, setData }: DayTableProps) => {
  const [editingDay, setEditingDay] = useState<DayPlan | null>(null);

  const updateDay = (day: DayPlan) => {
    setData((current) => ({
      ...current,
      dayPlans: current.dayPlans.map((item) => (item.id === day.id ? day : item)),
      documents: current.documents.map((document) => {
        if (day.documentIds.includes(document.id)) return { ...document, linkedDayId: day.id };
        if (document.linkedDayId === day.id) return { ...document, linkedDayId: "" };
        return document;
      }),
      expenses: current.expenses.map((expense) => {
        if (day.expenseIds.includes(expense.id)) return { ...expense, dayId: day.id };
        if (expense.dayId === day.id) return { ...expense, dayId: "" };
        return expense;
      }),
    }));
    setEditingDay(null);
  };

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
      <div>
        <h2 className="text-xl font-bold text-slate-950">Dag-tot-dag</h2>
        <p className="text-sm text-slate-500">
          Alleen dagnummer en datum zijn vooraf gevuld; de inhoud vul je zelf in.
        </p>
      </div>

      {editingDay ? (
        <DayForm data={data} day={editingDay} onCancel={() => setEditingDay(null)} onSubmit={updateDay} />
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Dag</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Locatie</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Vervoer</th>
              <th className="px-4 py-3">Verblijf</th>
              <th className="px-4 py-3">Activiteiten</th>
              <th className="px-4 py-3">Eten / reserveringen</th>
              <th className="px-4 py-3">Kosten</th>
              <th className="px-4 py-3">Boeking</th>
              <th className="px-4 py-3">Documenten</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.dayPlans.map((day) => {
              const transports = data.transports.filter((transport) => day.transportIds.includes(transport.id));
              return (
                <tr key={day.id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-slate-900">{day.dayNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(day.date)}</td>
                  <td className="px-4 py-3 text-slate-700">{preview(day.location)}</td>
                  <td className="px-4 py-3 text-slate-700">{day.dayType || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {transports.length
                      ? transports.map((transport) => `${transport.from} - ${transport.to}`).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{preview(day.accommodation)}</td>
                  <td className="px-4 py-3 text-slate-700">{preview(day.activities)}</td>
                  <td className="px-4 py-3 text-slate-700">{preview(day.meals)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {day.estimatedCost ? formatMoney(day.estimatedCost, data.trip?.currency) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={day.bookingStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{day.documentIds.length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={day.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="icon-btn"
                      type="button"
                      title="Dag bewerken"
                      onClick={() => setEditingDay(day)}
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
