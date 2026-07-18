import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import type { PackingCategory, PackingItem } from "../../types";

interface PackingCategoryCardProps {
  category: PackingCategory;
  items: PackingItem[];
  selected: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export const PackingCategoryCard = ({
  category,
  items,
  selected,
  onSelect,
  onRename,
  onDelete,
}: PackingCategoryCardProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const packedCount = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        selected ? "border-mint-300 ring-2 ring-mint-100" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) {
              onRename(name.trim());
              setEditing(false);
            }
          }}
        >
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">
              Opslaan
            </button>
            <button className="btn-secondary flex-1" type="button" onClick={() => setEditing(false)}>
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            aria-pressed={selected}
            className="w-full text-left"
            type="button"
            onClick={onSelect}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {packedCount} van {items.length} ingepakt
                </p>
              </div>
              <span className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-800">
                {progress}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-mint-500" style={{ width: `${progress}%` }} />
            </div>
          </button>
          <div className="mt-3 flex gap-2">
            <button
              className="icon-btn"
              type="button"
              title="Categorie hernoemen"
              onClick={() => setEditing(true)}
            >
              <Edit2 size={16} />
            </button>
            <button className="icon-btn text-rose-600" type="button" title="Categorie verwijderen" onClick={onDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
