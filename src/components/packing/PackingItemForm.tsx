import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import type { PackingCategory, PackingItem } from "../../types";

interface PackingItemFormProps {
  categories: PackingCategory[];
  selectedCategoryId: string;
  travelerNames: string[];
  initial?: PackingItem;
  onSubmit: (item: PackingItem) => void;
  onCancel: () => void;
}

const uniqueNames = (names: string[]) => Array.from(new Set(names.filter(Boolean)));

const createEmptyItem = (categoryId: string): PackingItem => ({
  id: createId("pack"),
  name: "",
  categoryId,
  quantity: 1,
  packed: false,
  essential: false,
  assignedTo: [],
  notes: "",
});

export const PackingItemForm = ({
  categories,
  selectedCategoryId,
  travelerNames,
  initial,
  onSubmit,
  onCancel,
}: PackingItemFormProps) => {
  const [form, setForm] = useState<PackingItem>(() => ({
    ...(initial ?? createEmptyItem(selectedCategoryId)),
    assignedTo: uniqueNames(initial?.assignedTo ?? []),
  }));
  const [error, setError] = useState("");
  const assignmentOptions = uniqueNames([...travelerNames, ...form.assignedTo]);

  const toggleTraveler = (name: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      assignedTo: checked
        ? uniqueNames([...current.assignedTo, name])
        : current.assignedTo.filter((traveler) => traveler !== name),
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Vul een itemnaam in.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      quantity: Math.max(1, Number(form.quantity) || 1),
      assignedTo: uniqueNames(form.assignedTo),
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="label">Naam</span>
          <input
            autoFocus
            className="input mt-1"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Wat wil je meenemen?"
          />
        </label>

        <label>
          <span className="label">Categorie</span>
          <select
            className="input mt-1"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Aantal</span>
          <input
            className="input mt-1"
            min={1}
            type="number"
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
          />
        </label>

        <div className="flex flex-wrap items-center gap-5 pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-mint-600"
              type="checkbox"
              checked={form.packed}
              onChange={(event) => setForm({ ...form, packed: event.target.checked })}
            />
            Ingepakt
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-mint-600"
              type="checkbox"
              checked={form.essential}
              onChange={(event) => setForm({ ...form, essential: event.target.checked })}
            />
            Essentieel
          </label>
        </div>

        {assignmentOptions.length > 0 ? (
          <fieldset className="md:col-span-2">
            <legend className="label">Toewijzen aan</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {assignmentOptions.map((name) => {
                const checked = form.assignedTo.includes(name);
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
                      onChange={(event) => toggleTraveler(name, event.target.checked)}
                    />
                    {name}
                    {!travelerNames.includes(name) ? " (niet meer in reis)" : ""}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-500">Niemand gekozen betekent gezamenlijk.</p>
          </fieldset>
        ) : null}

        <label className="md:col-span-2">
          <span className="label">Notitie</span>
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
          Item opslaan
        </button>
      </div>
    </form>
  );
};
