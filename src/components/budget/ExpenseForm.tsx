import { useMemo, useState } from "react";
import { createId, formatMoney } from "../../data/emptyTrip";
import {
  expenseCategories,
  type AppData,
  type Expense,
  type ExpenseCategory,
  type PaidStatus,
} from "../../types";
import { ChecklistPicker } from "../ChecklistPicker";

interface ExpenseFormProps {
  data: AppData;
  initial?: Expense;
  onSubmit: (expense: Expense) => void;
  onCancel: () => void;
}

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

const createEmptyExpense = (currency: string, travelerNames: string[]): Expense => ({
  id: createId("expense"),
  title: "",
  category: "Verblijf",
  amount: 0,
  currency,
  paidStatus: "nog te betalen",
  paidBy: "",
  split: travelerNames.length > 1,
  splitBetween: [...travelerNames],
  dayId: "",
  destinationId: "",
  documentIds: [],
  bookingLink: "",
  notes: "",
});

export const ExpenseForm = ({ data, initial, onSubmit, onCancel }: ExpenseFormProps) => {
  const tripCurrency = data.trip?.currency ?? "EUR";
  const travelerNames = useMemo(
    () =>
      uniqueNames(
        data.trip?.travelerNames?.length
          ? data.trip.travelerNames
          : Array.from(
              { length: data.trip?.travelers ?? 0 },
              (_, index) => `Reiziger ${index + 1}`
            )
      ),
    [data.trip?.travelerNames, data.trip?.travelers]
  );
  const [form, setForm] = useState<Expense>(() => {
    if (!initial) return createEmptyExpense(tripCurrency, travelerNames);
    const fallbackParticipants = initial.split
      ? travelerNames
      : initial.paidBy
        ? [initial.paidBy]
        : travelerNames.slice(0, 1);
    return {
      ...initial,
      currency: tripCurrency,
      splitBetween: uniqueNames(initial.splitBetween?.length ? initial.splitBetween : fallbackParticipants),
    };
  });
  const [error, setError] = useState("");

  const participantOptions = uniqueNames([...travelerNames, ...(form.splitBetween ?? [])]);
  const payerOptions = uniqueNames([...travelerNames, form.paidBy]);
  const participantCount = form.splitBetween.length;
  const amountPerParticipant = participantCount > 0 ? form.amount / participantCount : 0;

  const toggleParticipant = (name: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      splitBetween: checked
        ? uniqueNames([...current.splitBetween, name])
        : current.splitBetween.filter((traveler) => traveler !== name),
    }));
  };

  const setSplitMode = (split: boolean) => {
    setForm((current) => ({
      ...current,
      split,
      splitBetween: split
        ? current.splitBetween.length > 0
          ? current.splitBetween
          : travelerNames
        : [current.splitBetween[0] ?? current.paidBy ?? travelerNames[0]].filter(Boolean),
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Vul een titel in.");
      return;
    }
    if (form.amount < 0) {
      setError("Het bedrag kan niet negatief zijn.");
      return;
    }
    if (form.paidStatus === "betaald" && !form.paidBy) {
      setError("Kies wie deze uitgave heeft betaald.");
      return;
    }
    if (travelerNames.length > 0 && form.splitBetween.length === 0) {
      setError("Kies voor wie deze uitgave is.");
      return;
    }
    onSubmit({
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
      currency: tripCurrency,
      splitBetween: uniqueNames(form.splitBetween),
    });
  };

  return (
    <form className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="label">Titel</span>
          <input
            autoFocus
            className="input mt-1"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Bijvoorbeeld: verblijf of treinticket"
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
            <option value="nog te betalen">Nog te betalen</option>
            <option value="betaald">Betaald</option>
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

        <div>
          <span className="label">Valuta</span>
          <p className="mt-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700">
            {tripCurrency}
          </p>
        </div>

        <label className="md:col-span-2">
          <span className="label">Betaald door</span>
          <select
            className="input mt-1"
            value={form.paidBy}
            onChange={(event) => setForm({ ...form, paidBy: event.target.value })}
          >
            <option value="">Nog niet toegewezen</option>
            {payerOptions.map((name) => (
              <option key={name} value={name}>
                {name}
                {!travelerNames.includes(name) ? " (niet meer in reis)" : ""}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Nodig om voorgeschoten bedragen en het onderlinge saldo te berekenen.
          </span>
        </label>
      </div>

      {travelerNames.length > 0 ? (
        <fieldset className="rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-bold text-slate-900">Voor wie is deze uitgave?</legend>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label="Manier van verdelen">
            <button
              aria-pressed={form.split}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                form.split ? "bg-mint-100 text-mint-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              type="button"
              onClick={() => setSplitMode(true)}
            >
              Verdelen
            </button>
            <button
              aria-pressed={!form.split}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                !form.split ? "bg-mint-100 text-mint-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              type="button"
              onClick={() => setSplitMode(false)}
            >
              Voor één reiziger
            </button>
          </div>

          {form.split ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {participantOptions.map((name) => {
                const checked = form.splitBetween.includes(name);
                return (
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      checked
                        ? "border-mint-300 bg-mint-50 text-mint-900"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    key={name}
                  >
                    <input
                      className="h-4 w-4 rounded border-slate-300 text-mint-600"
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleParticipant(name, event.target.checked)}
                    />
                    {name}
                  </label>
                );
              })}
            </div>
          ) : (
            <label className="mt-4 block max-w-sm">
              <span className="label">Kosten voor</span>
              <select
                className="input mt-1"
                value={form.splitBetween[0] ?? ""}
                onChange={(event) =>
                  setForm({ ...form, splitBetween: event.target.value ? [event.target.value] : [] })
                }
              >
                <option value="">Kies een reiziger</option>
                {participantOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {participantCount > 0 && form.amount > 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {form.split && participantCount > 1
                ? `${formatMoney(amountPerParticipant, form.currency)} per geselecteerde reiziger`
                : `${formatMoney(form.amount, form.currency)} voor ${form.splitBetween[0]}`}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
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

        <ChecklistPicker
          legend="Gekoppelde documenten"
          options={data.documents.map((document) => ({
            value: document.id,
            label: document.fileName,
            detail: document.documentType,
          }))}
          value={form.documentIds}
          onChange={(documentIds) => setForm((current) => ({ ...current, documentIds }))}
          hint="Een document kan aan één budgetpost tegelijk zijn gekoppeld. Een nieuwe keuze verplaatst de koppeling."
        />

        <label>
          <span className="label">Link naar boeking</span>
          <input
            className="input mt-1"
            type="url"
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
