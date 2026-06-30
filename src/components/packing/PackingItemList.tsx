import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, Edit2, PackagePlus, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import type { AppData, PackingCategory, PackingItem } from "../../types";
import { PackingItemForm } from "./PackingItemForm";

interface PackingItemListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  selectedCategory: PackingCategory | null;
}

type PackingFilter = "alles" | "nog niet ingepakt" | "essentieel";

export const PackingItemList = ({ data, setData, selectedCategory }: PackingItemListProps) => {
  const [filter, setFilter] = useState<PackingFilter>("alles");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | undefined>();

  const categoryItems = useMemo(
    () => data.packingItems.filter((item) => item.categoryId === selectedCategory?.id),
    [data.packingItems, selectedCategory?.id]
  );

  const visibleItems = useMemo(
    () =>
      categoryItems.filter((item) => {
        if (filter === "nog niet ingepakt") return !item.packed;
        if (filter === "essentieel") return item.essential;
        return true;
      }),
    [categoryItems, filter]
  );

  const upsertItem = (item: PackingItem) => {
    setData((current) => {
      const exists = current.packingItems.some((currentItem) => currentItem.id === item.id);
      return {
        ...current,
        packingItems: exists
          ? current.packingItems.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
          : [...current.packingItems, item],
      };
    });
    setShowForm(false);
    setEditingItem(undefined);
  };

  const deleteItem = (id: string) => {
    if (!window.confirm("Dit paklijst-item verwijderen?")) return;
    setData((current) => ({
      ...current,
      packingItems: current.packingItems.filter((item) => item.id !== id),
    }));
  };

  const togglePacked = (item: PackingItem) => {
    setData((current) => ({
      ...current,
      packingItems: current.packingItems.map((currentItem) =>
        currentItem.id === item.id ? { ...currentItem, packed: !currentItem.packed } : currentItem
      ),
    }));
  };

  if (!selectedCategory) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="Nog geen categorie geselecteerd"
        description="Maak of selecteer een categorie om items toe te voegen."
      />
    );
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{selectedCategory.name}</h3>
          <p className="text-sm text-slate-500">Items binnen de geselecteerde categorie.</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            setEditingItem(undefined);
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Item toevoegen
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["alles", "nog niet ingepakt", "essentieel"] as PackingFilter[]).map((option) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              filter === option ? "bg-mint-100 text-mint-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            key={option}
            type="button"
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {showForm ? (
        <PackingItemForm
          categories={data.packingCategories}
          initial={editingItem}
          selectedCategoryId={selectedCategory.id}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(undefined);
          }}
          onSubmit={upsertItem}
        />
      ) : null}

      {categoryItems.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Nog geen items in deze categorie."
          actionLabel="Item toevoegen"
          onAction={() => setShowForm(true)}
        />
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          Geen items gevonden met dit filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {visibleItems.map((item) => (
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between" key={item.id}>
              <div className="flex min-w-0 items-start gap-3">
                <button
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    item.packed
                      ? "border-mint-500 bg-mint-500 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                  type="button"
                  title="Ingepakt wisselen"
                  onClick={() => togglePacked(item)}
                >
                  <CheckCircle2 size={16} />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <StatusBadge status={item.packed ? "ingepakt" : "openstaand"} />
                    {item.essential ? <StatusBadge status="essentieel" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Aantal: {item.quantity}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="icon-btn"
                  type="button"
                  title="Item bewerken"
                  onClick={() => {
                    setEditingItem(item);
                    setShowForm(true);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="icon-btn text-rose-600"
                  type="button"
                  title="Item verwijderen"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
