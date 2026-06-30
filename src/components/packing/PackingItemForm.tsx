import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import type { PackingCategory, PackingItem } from "../../types";

interface PackingItemFormProps {
  categories: PackingCategory[];
  selectedCategoryId: string;
  initial?: PackingItem;
  onSubmit: (item: PackingItem) => void;
  onCancel: () => void;
}

const createEmptyItem = (categoryId: string): PackingItem => ({
  id: createId("pack"),
  name: "",
  categoryId,
  quantity: 1,
  packed: false,
  essential: false,
  notes: "",
});

export const PackingItemForm = ({
  categories,
  selectedCategoryId,
  initial,
  onSubmit,
  onCancel,
}: PackingItemFormProps) => {
  const [form, setForm] = useState<PackingItem>(initial ?? createEmptyItem(selectedCategoryId));
  const [error, setError] = useState("");

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
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="label">Naam</span>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Zelf invullen"
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
