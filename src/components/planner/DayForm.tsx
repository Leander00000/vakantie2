import { useState } from "react";
import {
  bookingStatuses,
  dayStatuses,
  dayTypes,
  type AppData,
  type BookingStatus,
  type DayPlan,
  type DayStatus,
  type DayType,
} from "../../types";
import { formatDate, formatMoney } from "../../data/emptyTrip";

interface DayFormProps {
  data: AppData;
  day: DayPlan;
  onSubmit: (day: DayPlan) => void;
  onCancel: () => void;
}

const selectedOptions = (select: HTMLSelectElement) =>
  Array.from(select.selectedOptions).map((option) => option.value);

export const DayForm = ({ data, day, onSubmit, onCancel }: DayFormProps) => {
  const [form, setForm] = useState<DayPlan>(day);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      ...form,
      estimatedCost: Number(form.estimatedCost) || 0,
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-mint-700">Dag {form.dayNumber}</p>
          <h3 className="text-lg font-bold text-slate-950">{formatDate(form.date)}</h3>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Annuleren
          </button>
          <button className="btn-primary" type="submit">
            Dag opslaan
          </button>
        </div>
      </div>

      <datalist id={`destinations-${form.id}`}>
        {data.destinations.map((destination) => (
          <option key={destination.id} value={destination.name} />
        ))}
      </datalist>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="label">Locatie / bestemming</span>
          <input
            className="input mt-1"
            list={`destinations-${form.id}`}
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="Kies of vul zelf in"
          />
        </label>

        <label>
          <span className="label">Type dag</span>
          <select
            className="input mt-1"
            value={form.dayType}
            onChange={(event) => setForm({ ...form, dayType: event.target.value as DayType })}
          >
            {dayTypes.map((type) => (
              <option key={type || "empty"} value={type}>
                {type || "geen keuze"}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Dagstatus</span>
          <select
            className="input mt-1"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as DayStatus })}
          >
            {dayStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Boekingsstatus</span>
          <select
            className="input mt-1"
            value={form.bookingStatus}
            onChange={(event) =>
              setForm({ ...form, bookingStatus: event.target.value as BookingStatus })
            }
          >
            {bookingStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Vervoer koppelen</span>
          <select
            multiple
            className="input mt-1 min-h-28"
            value={form.transportIds}
            onChange={(event) => setForm({ ...form, transportIds: selectedOptions(event.currentTarget) })}
          >
            {data.transports.map((transport) => (
              <option key={transport.id} value={transport.id}>
                {transport.from} - {transport.to} ({transport.mode})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Documenten koppelen</span>
          <select
            multiple
            className="input mt-1 min-h-28"
            value={form.documentIds}
            onChange={(event) => setForm({ ...form, documentIds: selectedOptions(event.currentTarget) })}
          >
            {data.documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.fileName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Budgetposten koppelen</span>
          <select
            multiple
            className="input mt-1 min-h-28"
            value={form.expenseIds}
            onChange={(event) => setForm({ ...form, expenseIds: selectedOptions(event.currentTarget) })}
          >
            {data.expenses.map((expense) => (
              <option key={expense.id} value={expense.id}>
                {expense.title} - {formatMoney(expense.amount, expense.currency)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Kostenindicatie</span>
          <input
            className="input mt-1"
            min={0}
            step="0.01"
            type="number"
            value={form.estimatedCost}
            onChange={(event) => setForm({ ...form, estimatedCost: Number(event.target.value) })}
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Verblijf</span>
          <input
            className="input mt-1"
            value={form.accommodation}
            onChange={(event) => setForm({ ...form, accommodation: event.target.value })}
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Activiteiten</span>
          <textarea
            className="input mt-1 min-h-24"
            value={form.activities}
            onChange={(event) => setForm({ ...form, activities: event.target.value })}
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Eten / reserveringen</span>
          <textarea
            className="input mt-1 min-h-24"
            value={form.meals}
            onChange={(event) => setForm({ ...form, meals: event.target.value })}
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Notities</span>
          <textarea
            className="input mt-1 min-h-24"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
      </div>
    </form>
  );
};
