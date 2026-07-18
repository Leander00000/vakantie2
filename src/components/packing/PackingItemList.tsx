import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  CheckCircle2,
  Edit2,
  ListPlus,
  PackagePlus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import type { AppData, PackingCategory, PackingItem } from "../../types";
import { BulkPackingForm } from "./BulkPackingForm";
import { PackingItemForm } from "./PackingItemForm";

interface PackingItemListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  selectedCategory: PackingCategory | null;
}

type PackingFilter = "alles" | "openstaand" | "ingepakt" | "essentieel";
const sharedFilter = "__gezamenlijk__";

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

export const PackingItemList = ({ data, setData, selectedCategory }: PackingItemListProps) => {
  const [filter, setFilter] = useState<PackingFilter>("alles");
  const [travelerFilter, setTravelerFilter] = useState("alles");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | undefined>();
  const formRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showForm && !showBulkForm) return;

    const frame = window.requestAnimationFrame(() => {
      formRegionRef.current?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingItem?.id, showBulkForm, showForm]);

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

  const categoryItems = useMemo(
    () => data.packingItems.filter((item) => item.categoryId === selectedCategory?.id),
    [data.packingItems, selectedCategory?.id]
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("nl-NL");
    return categoryItems.filter((item) => {
      const assignedTo = item.assignedTo ?? [];
      const statusMatches =
        filter === "alles" ||
        (filter === "openstaand" && !item.packed) ||
        (filter === "ingepakt" && item.packed) ||
        (filter === "essentieel" && item.essential);
      const travelerMatches =
        travelerFilter === "alles" ||
        (travelerFilter === sharedFilter && assignedTo.length === 0) ||
        assignedTo.includes(travelerFilter);
      const searchMatches =
        !normalizedQuery ||
        `${item.name} ${item.notes}`.toLocaleLowerCase("nl-NL").includes(normalizedQuery);
      return statusMatches && travelerMatches && searchMatches;
    });
  }, [categoryItems, filter, searchQuery, travelerFilter]);

  const upsertItem = (item: PackingItem) => {
    setData((current) => {
      const normalizedItem = { ...item, assignedTo: uniqueNames(item.assignedTo ?? []) };
      const exists = current.packingItems.some((currentItem) => currentItem.id === item.id);
      return {
        ...current,
        packingItems: exists
          ? current.packingItems.map((currentItem) =>
              currentItem.id === item.id ? normalizedItem : currentItem
            )
          : [...current.packingItems, normalizedItem],
      };
    });
    setShowForm(false);
    setEditingItem(undefined);
  };

  const addBulkItems = (items: PackingItem[]) => {
    setData((current) => ({
      ...current,
      packingItems: [...current.packingItems, ...items],
    }));
    setShowBulkForm(false);
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

  const packVisibleItems = () => {
    const visibleIds = new Set(visibleItems.map((item) => item.id));
    setData((current) => ({
      ...current,
      packingItems: current.packingItems.map((item) =>
        visibleIds.has(item.id) ? { ...item, packed: true } : item
      ),
    }));
  };

  const openSingleForm = (item?: PackingItem) => {
    setEditingItem(item);
    setShowBulkForm(false);
    setShowForm(true);
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
          <p className="text-sm text-slate-500">
            {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"} in deze categorie
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingItem(undefined);
              setShowBulkForm(true);
            }}
          >
            <ListPlus size={16} />
            Meerdere toevoegen
          </button>
          <button className="btn-primary" type="button" onClick={() => openSingleForm()}>
            <Plus size={16} />
            Item toevoegen
          </button>
        </div>
      </div>

      {categoryItems.length > 0 ? (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(180px,1fr)_auto_auto] lg:items-end">
          <label>
            <span className="label">Zoeken</span>
            <div className="relative mt-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="input pl-9"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Zoek in naam of notitie"
              />
            </div>
          </label>

          <label>
            <span className="label">Voor wie</span>
            <select
              className="input mt-1 min-w-44"
              value={travelerFilter}
              onChange={(event) => setTravelerFilter(event.target.value)}
            >
              <option value="alles">Iedereen</option>
              <option value={sharedFilter}>Gezamenlijk</option>
              {travelerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="btn-secondary"
            type="button"
            disabled={visibleItems.length === 0 || visibleItems.every((item) => item.packed)}
            onClick={packVisibleItems}
          >
            <CheckCheck size={16} />
            Zichtbare afvinken
          </button>
        </div>
      ) : null}

      {categoryItems.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Paklijststatus filter">
            {(["alles", "openstaand", "ingepakt", "essentieel"] as PackingFilter[]).map((option) => (
              <button
                aria-pressed={filter === option}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  filter === option
                    ? "bg-mint-100 text-mint-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                key={option}
                type="button"
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-500" aria-live="polite">
            {visibleItems.length} van {categoryItems.length}
          </span>
        </div>
      ) : null}

      {showForm || showBulkForm ? (
        <div className="scroll-mt-64 md:scroll-mt-52" ref={formRegionRef}>
          {showForm ? (
            <PackingItemForm
              categories={data.packingCategories}
              initial={editingItem}
              key={editingItem?.id ?? "new-packing-item"}
              selectedCategoryId={selectedCategory.id}
              travelerNames={travelerNames}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(undefined);
              }}
              onSubmit={upsertItem}
            />
          ) : null}

          {showBulkForm ? (
            <BulkPackingForm
              categoryId={selectedCategory.id}
              travelerNames={travelerNames}
              onCancel={() => setShowBulkForm(false)}
              onSubmit={addBulkItems}
            />
          ) : null}
        </div>
      ) : null}

      {categoryItems.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Nog geen items in deze categorie."
          description="Voeg één item toe of plak een hele lijst in één keer."
          actionLabel="Item toevoegen"
          onAction={() => openSingleForm()}
        />
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          Geen items gevonden met deze zoekopdracht en filters.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {visibleItems.map((item) => {
            const assignedTo = item.assignedTo ?? [];
            return (
              <div
                className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                  item.packed ? "bg-slate-50/70" : ""
                }`}
                key={item.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    aria-label={`${item.name} ${item.packed ? "als niet ingepakt markeren" : "als ingepakt markeren"}`}
                    aria-pressed={item.packed}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      item.packed
                        ? "border-mint-500 bg-mint-500 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                    type="button"
                    title="Ingepakt wisselen"
                    onClick={() => togglePacked(item)}
                  >
                    <CheckCircle2 size={17} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold text-slate-950 ${item.packed ? "line-through opacity-60" : ""}`}>
                        {item.name}
                      </p>
                      <StatusBadge status={item.packed ? "ingepakt" : "openstaand"} />
                      {item.essential ? <StatusBadge status="essentieel" /> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span>Aantal: {item.quantity}</span>
                      <span>{assignedTo.length ? assignedTo.join(", ") : "Gezamenlijk"}</span>
                    </div>
                    {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-btn"
                    type="button"
                    title="Item bewerken"
                    onClick={() => openSingleForm(item)}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
