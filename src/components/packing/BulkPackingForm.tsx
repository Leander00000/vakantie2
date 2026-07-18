import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import type { PackingItem } from "../../types";

interface BulkPackingFormProps {
  categoryId: string;
  travelerNames: string[];
  onSubmit: (items: PackingItem[]) => void;
  onCancel: () => void;
}

interface ParsedLine {
  name: string;
  quantity: number;
}

const uniqueNames = (names: string[]) => Array.from(new Set(names.filter(Boolean)));

const parseLine = (rawLine: string): ParsedLine | null => {
  const line = rawLine
    .trim()
    .replace(/^[-*•]\s*/, "")
    .replace(/^\[[ xX]\]\s*/, "");
  if (!line) return null;

  const amountFirst = line.match(/^(\d+)\s*[x×]\s+(.+)$/i);
  if (amountFirst) {
    return { name: amountFirst[2].trim(), quantity: Math.max(1, Number(amountFirst[1])) };
  }

  const amountLast = line.match(/^(.+?)\s+[x×]\s*(\d+)$/i);
  if (amountLast) {
    return { name: amountLast[1].trim(), quantity: Math.max(1, Number(amountLast[2])) };
  }

  return { name: line, quantity: 1 };
};

const parseLines = (value: string) => {
  const combined = new Map<string, ParsedLine>();
  value.split(/\r?\n/).forEach((rawLine) => {
    const parsed = parseLine(rawLine);
    if (!parsed?.name) return;
    const key = parsed.name.toLocaleLowerCase("nl-NL");
    const existing = combined.get(key);
    combined.set(
      key,
      existing ? { ...existing, quantity: existing.quantity + parsed.quantity } : parsed
    );
  });
  return Array.from(combined.values());
};

export const BulkPackingForm = ({
  categoryId,
  travelerNames,
  onSubmit,
  onCancel,
}: BulkPackingFormProps) => {
  const [lines, setLines] = useState("");
  const [essential, setEssential] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [error, setError] = useState("");
  const parsedCount = parseLines(lines).length;

  const toggleTraveler = (name: string, checked: boolean) => {
    setAssignedTo((current) =>
      checked ? uniqueNames([...current, name]) : current.filter((traveler) => traveler !== name)
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseLines(lines);
    if (parsed.length === 0) {
      setError("Plak of typ minimaal één item.");
      return;
    }
    onSubmit(
      parsed.map((item) => ({
        id: createId("pack"),
        name: item.name,
        categoryId,
        quantity: item.quantity,
        packed: false,
        essential,
        assignedTo: [...assignedTo],
        notes: "",
      }))
    );
  };

  return (
    <form className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <label className="block">
        <span className="label">Meerdere items tegelijk</span>
        <textarea
          autoFocus
          className="input mt-1 min-h-40"
          value={lines}
          onChange={(event) => {
            setLines(event.target.value);
            setError("");
          }}
          placeholder={"Eén item per regel\n3x T-shirts\n- Zonnebril\nRegenjas"}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Eén item per regel. Gebruik eventueel “3x Item” om een aantal mee te geven.
        </span>
      </label>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 pt-2 text-sm font-semibold text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300 text-mint-600"
            type="checkbox"
            checked={essential}
            onChange={(event) => setEssential(event.target.checked)}
          />
          Markeer alle als essentieel
        </label>

        {travelerNames.length > 0 ? (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Toewijzen aan
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {travelerNames.map((name) => (
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    assignedTo.includes(name)
                      ? "border-mint-300 bg-mint-50 text-mint-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  key={name}
                >
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-mint-600"
                    type="checkbox"
                    checked={assignedTo.includes(name)}
                    onChange={(event) => toggleTraveler(name, event.target.checked)}
                  />
                  {name}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">Niemand gekozen betekent gezamenlijk.</p>
          </fieldset>
        ) : null}
      </div>

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500" aria-live="polite">
          {parsedCount === 0 ? "Nog geen items herkend" : `${parsedCount} unieke items herkend`}
        </span>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Annuleren
          </button>
          <button className="btn-primary" type="submit">
            {parsedCount > 0 ? `${parsedCount} items toevoegen` : "Items toevoegen"}
          </button>
        </div>
      </div>
    </form>
  );
};
