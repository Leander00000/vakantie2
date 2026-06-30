import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
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

  const filteredExpenses = useMemo(
    () =>
      data.expenses.filter((expense) => {
        const categoryMatches = categoryFilter === "alles" || expense.category === categoryFilter;
        const paidMatches = paidFilter === "alles" || expense.paidStatus === paidFilter;
        return categoryMatches && paidMatches;
      }),
    [categoryFilter, data.expenses, paidFilter]
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Budget</h2>
        <p className="text-sm text-slate-500">Budgetcategorieën staan klaar zonder vooraf ingevulde bedragen.</p>
      </div>

      <BudgetSummary data={data} setData={setData} />

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
      </div>

      <ExpenseList data={data} filteredExpenses={filteredExpenses} setData={setData} />
    </section>
  );
};
