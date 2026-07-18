import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { expenseCategories, type AppData, type ExpenseCategory, type PaidStatus } from "../types";
import { BudgetSummary } from "../components/budget/BudgetSummary";
import { ExpenseList } from "../components/budget/ExpenseList";

interface BudgetPageProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

type CategoryFilter = "alles" | ExpenseCategory;
type PaidFilter = "alles" | PaidStatus;

export const BudgetPage = ({ data, setData }: BudgetPageProps) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("alles");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("alles");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExpenses = useMemo(
    () =>
      data.expenses.filter((expense) => {
        const categoryMatches = categoryFilter === "alles" || expense.category === categoryFilter;
        const paidMatches = paidFilter === "alles" || expense.paidStatus === paidFilter;
        const normalizedQuery = searchQuery.trim().toLocaleLowerCase("nl-NL");
        const searchMatches =
          !normalizedQuery ||
          [expense.title, expense.notes, expense.paidBy, expense.category]
            .join(" ")
            .toLocaleLowerCase("nl-NL")
            .includes(normalizedQuery);
        return categoryMatches && paidMatches && searchMatches;
      }),
    [categoryFilter, data.expenses, paidFilter, searchQuery]
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Budget</h2>
        <p className="text-sm text-slate-500">
          Bewaak categorieën, verdeel kosten en zie direct wie wat heeft voorgeschoten.
        </p>
      </div>

      <BudgetSummary data={data} setData={setData} />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="min-w-64 flex-1">
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
              placeholder="Titel, notitie of reiziger"
            />
          </div>
        </label>

        <label>
          <span className="label">Categorie</span>
          <select
            className="input mt-1 min-w-48"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
          >
            <option value="alles">Alle categorieën</option>
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
            className="input mt-1 min-w-48"
            value={paidFilter}
            onChange={(event) => setPaidFilter(event.target.value as PaidFilter)}
          >
            <option value="alles">Alles</option>
            <option value="nog te betalen">Nog te betalen</option>
            <option value="betaald">Betaald</option>
          </select>
        </label>

        <p className="pb-2 text-sm text-slate-500" aria-live="polite">
          {filteredExpenses.length} van {data.expenses.length}
        </p>
      </div>

      <ExpenseList data={data} filteredExpenses={filteredExpenses} setData={setData} />
    </section>
  );
};
