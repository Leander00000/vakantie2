import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { currencies, type TripSetupInput } from "../types";

interface TripSetupFormProps {
  onCreate: (input: TripSetupInput) => void;
}

export const TripSetupForm = ({ onCreate }: TripSetupFormProps) => {
  const [form, setForm] = useState<TripSetupInput>({
    name: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    currency: "EUR",
    totalBudget: undefined,
    notes: "",
  });
  const [error, setError] = useState("");

  const update = <K extends keyof TripSetupInput>(key: K, value: TripSetupInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Vul een reisnaam in.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Vul een startdatum en einddatum in.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("De einddatum moet op of na de startdatum liggen.");
      return;
    }
    setError("");
    onCreate(form);
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="panel">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-mint-800">
            <CalendarPlus size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-mint-700">Eerste stap</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Nieuwe reis aanmaken</h2>
            <p className="mt-2 text-sm text-slate-500">
              Start met de basis. Bestemmingen, vervoer, kosten, paklijstitems en documenten voeg je daarna zelf toe.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="sm:col-span-2">
            <span className="label">Reisnaam</span>
            <input
              className="input mt-1"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Zelf invullen"
            />
          </label>

          <label>
            <span className="label">Startdatum</span>
            <input
              className="input mt-1"
              type="date"
              value={form.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </label>

          <label>
            <span className="label">Einddatum</span>
            <input
              className="input mt-1"
              type="date"
              value={form.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </label>

          <label>
            <span className="label">Reizigers</span>
            <input
              className="input mt-1"
              min={1}
              type="number"
              value={form.travelers}
              onChange={(event) => update("travelers", Number(event.target.value))}
            />
          </label>

          <label>
            <span className="label">Valuta</span>
            <select
              className="input mt-1"
              value={form.currency}
              onChange={(event) => update("currency", event.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">Optioneel totaalbudget</span>
            <input
              className="input mt-1"
              min={0}
              step="0.01"
              type="number"
              value={form.totalBudget ?? ""}
              onChange={(event) =>
                update("totalBudget", event.target.value === "" ? undefined : Number(event.target.value))
              }
              placeholder="Geen bedrag ingevuld"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="label">Korte omschrijving / reisdoel</span>
            <textarea
              className="input mt-1 min-h-24"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Optioneel"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-rose-700 sm:col-span-2">{error}</p> : null}

          <div className="flex justify-end sm:col-span-2">
            <button className="btn-primary" type="submit">
              Reis aanmaken
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
