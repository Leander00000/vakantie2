import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createId } from "../data/emptyTrip";
import type { AppData } from "../types";
import { PackingCategoryCard } from "../components/packing/PackingCategoryCard";
import { PackingItemList } from "../components/packing/PackingItemList";

interface PackingPageProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

export const PackingPage = ({ data, setData }: PackingPageProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(data.packingCategories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (!data.packingCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(data.packingCategories[0]?.id ?? "");
    }
  }, [data.packingCategories, selectedCategoryId]);

  const selectedCategory = data.packingCategories.find((category) => category.id === selectedCategoryId) ?? null;
  const packedCount = data.packingItems.filter((item) => item.packed).length;
  const totalProgress = data.packingItems.length
    ? Math.round((packedCount / data.packingItems.length) * 100)
    : 0;

  const itemsByCategory = useMemo(
    () =>
      new Map(
        data.packingCategories.map((category) => [
          category.id,
          data.packingItems.filter((item) => item.categoryId === category.id),
        ])
      ),
    [data.packingCategories, data.packingItems]
  );

  const addCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const category = { id: createId("cat"), name: newCategoryName.trim() };
    setData((current) => ({
      ...current,
      packingCategories: [...current.packingCategories, category],
    }));
    setSelectedCategoryId(category.id);
    setNewCategoryName("");
  };

  const renameCategory = (id: string, name: string) => {
    setData((current) => ({
      ...current,
      packingCategories: current.packingCategories.map((category) =>
        category.id === id ? { ...category, name } : category
      ),
    }));
  };

  const deleteCategory = (id: string) => {
    if (!window.confirm("Deze categorie en bijbehorende items verwijderen?")) return;
    setData((current) => ({
      ...current,
      packingCategories: current.packingCategories.filter((category) => category.id !== id),
      packingItems: current.packingItems.filter((item) => item.categoryId !== id),
    }));
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Paklijst</h2>
          <p className="text-sm text-slate-500">Categorieën staan klaar, maar er zijn geen verplichte items.</p>
        </div>
        <div className="min-w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-600">Totale voortgang</span>
            <span className="text-lg font-bold text-slate-950">{totalProgress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-mint-500" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={addCategory}>
            <label>
              <span className="label">Categorie toevoegen</span>
              <div className="mt-1 flex gap-2">
                <input
                  className="input"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Nieuwe categorie"
                />
                <button className="btn-primary px-3" type="submit" title="Categorie toevoegen">
                  <Plus size={16} />
                </button>
              </div>
            </label>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {data.packingCategories.map((category) => (
              <PackingCategoryCard
                category={category}
                items={itemsByCategory.get(category.id) ?? []}
                key={category.id}
                selected={category.id === selectedCategoryId}
                onDelete={() => deleteCategory(category.id)}
                onRename={(name) => renameCategory(category.id, name)}
                onSelect={() => setSelectedCategoryId(category.id)}
              />
            ))}
          </div>
        </aside>

        <PackingItemList data={data} selectedCategory={selectedCategory} setData={setData} />
      </div>
    </section>
  );
};
