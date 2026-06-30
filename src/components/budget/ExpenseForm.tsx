import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import {
  currencies,
  expenseCategories,
  type AppData,
  type Expense,
  type ExpenseCategory,
  type PaidStatus,
} from "../../types";

interface ExpenseFormProps {
  data: AppData;
  initial?: Expense;
  onSubmit: (expense: Expense) => void;
  onCancel: () => void;
}

const createEmptyExpense = (currency: string): Expense => ({
  id: createId("expense"),
  title: "",
  category: "Verblijf",
  amount: 0,
  currency,
  paidStatus: "nog te betalen",
  paidBy: "",
  split: true,
  dayId: "",
  destinationId: "",
  documentIds: [],
  bookingLink: "",
  notes: "",
});

const selectedOptions = (select: HTMLSelectElement) =>
  Array.from(select.selectedOptions).map((option) => option.value);

export const ExpenseForm = ({ data, initial, onSubmit, onCancel }: ExpenseFormProps) => {
  const [form, setForm] = useState<Expense>(initial ?? createEmptyExpense(data.trip?.currency ?? "EUR"));
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Vul een titel in.");
      return;
    }
    onSubmit({
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="label">Titel</span>
          <input
            className="input mt-1"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Zelf invullen"
          />
        </label>

        <label>
          <span className="label">Categorie</span>
          <select
            className="input mt-1"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}
          >
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Betaalstatus</span>
          <select
            className="input mt-1"
            value={form.paidStatus}
            onChange={(event) => setForm({ ...form, paidStatus: event.target.value as PaidStatus })}
          >
            <option value="nog te betalen">nog te betalen</option>
            <option value="betaald">betaald</option>
          </select>
        </label>

        <label>
          <span className="label">Bedrag</span>
          <input
            className="input mt-1"
            min={0}
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
          />
        </label>

        <label>
          <span className="label">Valuta</span>
          <select
            className="input mt-1"
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Betaald door</span>
          <input
            className="input mt-1"
            value={form.paidBy}
            onChange={(event) => setForm({ ...form, paidBy: event.target.value })}
          />
        </label>

        <label className="flex items-center gap-3 pt-6 text-sm font-semibold text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300 text-mint-600"
            type="checkbox"
            checked={form.split}
            onChange={(event) => setForm({ ...form, split: event.target.checked })}
          />
          Te verdelen
        </label>

        <label>
          <span className="label">Gekoppelde dag</span>
          <select
            className="input mt-1"
            value={form.dayId}
            onChange={(event) => setForm({ ...form, dayId: event.target.value })}
          >
            <option value="">Geen dag</option>
            {data.dayPlans.map((day) => (
              <option key={day.id} value={day.id}>
                Dag {day.dayNumber} - {day.date}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Gekoppelde bestemming</span>
          <select
            className="input mt-1"
            value={form.destinationId}
            onChange={(event) => setForm({ ...form, destinationId: event.target.value })}
          >
            <option value="">Geen bestemming</option>
            {data.destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="label">Gekoppeld document</span>
          <select
            multiple
            className="input mt-1 min-h-24"
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

        <label className="md:col-span-2">
          <span className="label">Link naar boeking</span>
          <input
            className="input mt-1"
            value={form.bookingLink}
            onChange={(event) => setForm({ ...form, bookingLink: event.target.value })}
            placeholder="https://"
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

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button className="btn-primary" type="submit">
          Uitgave opslaan
        </button>
      </div>
    </form>
  );
};
