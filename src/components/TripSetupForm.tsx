import { useState } from "react";
import { CalendarPlus, Pencil, UserRound } from "lucide-react";
import { currencies, type TripSetupInput } from "../types";

interface TripSetupFormProps {
  onCreate: (input: TripSetupInput) => void;
  initial?: TripSetupInput;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

const emptyForm: TripSetupInput = {
    name: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    travelerNames: [""],
    currency: "EUR",
    totalBudget: undefined,
    notes: "",
};

export const TripSetupForm = ({
  onCreate,
  initial,
  mode = "create",
  onCancel,
}: TripSetupFormProps) => {
  const [form, setForm] = useState<TripSetupInput>(initial ?? emptyForm);
  const [error, setError] = useState("");

  const update = <K extends keyof TripSetupInput>(key: K, value: TripSetupInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTravelerCount = (travelers: number) => {
    const count = Math.max(1, Math.min(20, travelers || 1));
    setForm((current) => ({
      ...current,
      travelers: count,
      travelerNames: Array.from(
        { length: count },
        (_, index) => current.travelerNames[index] ?? ""
      ),
    }));
  };

  const updateTravelerName = (index: number, name: string) => {
    setForm((current) => ({
      ...current,
      travelerNames: current.travelerNames.map((value, itemIndex) =>
        itemIndex === index ? name : value
      ),
    }));
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
    const travelerCount = Math.max(1, Math.min(20, form.travelers || 1));
    const travelerNames = Array.from(
      { length: travelerCount },
      (_, index) => form.travelerNames[index]?.trim() || `Reiziger ${index + 1}`
    );
    const normalizedNames = travelerNames.map((name) => name.toLocaleLowerCase("nl-NL"));
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setError("Geef iedere reiziger een unieke naam voor een correcte kostenverdeling.");
      return;
    }
    setError("");
    onCreate({ ...form, travelers: travelerCount, travelerNames });
  };

  return (
    <section className={mode === "create" ? "mx-auto max-w-3xl" : "mx-auto max-w-4xl"}>
      <div className="panel">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-mint-800">
            {mode === "create" ? <CalendarPlus size={24} /> : <Pencil size={22} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-mint-700">
              {mode === "create" ? "Eerste stap" : "Reisinstellingen"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {mode === "create" ? "Nieuwe reis aanmaken" : "Reisgegevens bewerken"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "create"
                ? "Start met de basis. Bestemmingen, vervoer, kosten, paklijstitems en documenten voeg je daarna zelf toe."
                : "Een gewijzigde datumrange past de lege reisdagen automatisch aan. Ingevulde dagen binnen de nieuwe periode blijven bewaard."}
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
              max={20}
              type="number"
              value={form.travelers}
              onChange={(event) => updateTravelerCount(Number(event.target.value))}
            />
          </label>

          <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Namen reizigers
            </legend>
            <p className="mb-3 text-sm text-slate-500">
              Optioneel, maar handig voor de kostenverdeling en paklijst.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {form.travelerNames.map((name, index) => (
                <label className="relative" key={index}>
                  <span className="sr-only">Naam reiziger {index + 1}</span>
                  <UserRound
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="input pl-9"
                    value={name}
                    onChange={(event) => updateTravelerName(index, event.target.value)}
                    placeholder={`Reiziger ${index + 1}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>

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

          {error ? (
            <p className="text-sm font-semibold text-rose-700 sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            {mode === "edit" && onCancel ? (
              <button className="btn-secondary" type="button" onClick={onCancel}>
                Annuleren
              </button>
            ) : null}
            <button className="btn-primary" type="submit">
              {mode === "create" ? "Reis aanmaken" : "Wijzigingen opslaan"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
