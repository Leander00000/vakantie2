import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Banknote, PieChart, Wallet } from "lucide-react";
import { expenseCategories, type AppData } from "../../types";
import { formatMoney } from "../../data/emptyTrip";

interface BudgetSummaryProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

export const BudgetSummary = ({ data, setData }: BudgetSummaryProps) => {
  const trip = data.trip;
  const [budgetInput, setBudgetInput] = useState(trip?.totalBudget?.toString() ?? "");
  const total = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paid = data.expenses
    .filter((expense) => expense.paidStatus === "betaald")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const open = total - paid;
  const perPerson = trip?.travelers ? total / trip.travelers : total;
  const budget = trip?.totalBudget ?? 0;
  const percentage = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  const setBudget = () => {
    setData((current) => ({
      ...current,
      trip: current.trip
        ? {
            ...current.trip,
            totalBudget: budgetInput === "" ? undefined : Math.max(0, Number(budgetInput) || 0),
          }
        : current.trip,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Wallet size={17} />
            Totaal uitgegeven
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatMoney(total, trip?.currency)}</p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Banknote size={17} />
            Betaald
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatMoney(paid, trip?.currency)}</p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Banknote size={17} />
            Openstaand
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formatMoney(open, trip?.currency)}</p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <PieChart size={17} />
            Per persoon
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(perPerson, trip?.currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Budget</h3>
              <p className="text-sm text-slate-500">
                {budget > 0
                  ? `${formatMoney(total, trip?.currency)} van ${formatMoney(budget, trip?.currency)} budget gebruikt`
                  : "Nog geen totaalbudget ingesteld."}
              </p>
            </div>
            <div className="flex max-w-sm flex-1 gap-2 sm:justify-end">
              <input
                className="input"
                min={0}
                step="0.01"
                type="number"
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
                placeholder="Totaalbudget"
              />
              <button className="btn-secondary whitespace-nowrap" type="button" onClick={setBudget}>
                Instellen
              </button>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="panel">
          <h3 className="text-base font-bold text-slate-950">Kosten per categorie</h3>
          <div className="mt-3 space-y-2">
            {expenseCategories.map((category) => {
              const amount = data.expenses
                .filter((expense) => expense.category === category)
                .reduce((sum, expense) => sum + expense.amount, 0);
              return (
                <div className="flex items-center justify-between gap-3 text-sm" key={category}>
                  <span className="text-slate-600">{category}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(amount, trip?.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
