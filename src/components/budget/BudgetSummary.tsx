import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import { Banknote, CircleDollarSign, PieChart, Wallet } from "lucide-react";
import { formatMoney } from "../../data/emptyTrip";
import {
  expenseCategories,
  type AppData,
  type Expense,
  type ExpenseCategory,
} from "../../types";

interface BudgetSummaryProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

interface TravelerBudgetRow {
  name: string;
  totalShare: number;
  paidShare: number;
  openShare: number;
  advanced: number;
}

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

const expenseParticipants = (expense: Expense, travelerNames: string[]) => {
  const selected = uniqueNames(expense.splitBetween ?? []).filter((name) =>
    travelerNames.includes(name)
  );
  if (selected.length > 0) return selected;
  if (expense.split) return travelerNames;
  if (travelerNames.includes(expense.paidBy)) return [expense.paidBy];
  return travelerNames.length === 1 ? travelerNames : [];
};

export const BudgetSummary = ({ data, setData }: BudgetSummaryProps) => {
  const trip = data.trip;
  const travelerNames = useMemo(
    () =>
      uniqueNames(
        trip?.travelerNames?.length
          ? trip.travelerNames
          : Array.from({ length: trip?.travelers ?? 0 }, (_, index) => `Reiziger ${index + 1}`)
      ),
    [trip?.travelerNames, trip?.travelers]
  );

  const summary = useMemo(() => {
    const total = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paid = data.expenses
      .filter((expense) => expense.paidStatus === "betaald")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = Object.fromEntries(
      expenseCategories.map((category) => [
        category,
        data.expenses
          .filter((expense) => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0),
      ])
    ) as Record<ExpenseCategory, number>;

    const travelers = new Map<string, TravelerBudgetRow>(
      travelerNames.map((name) => [
        name,
        { name, totalShare: 0, paidShare: 0, openShare: 0, advanced: 0 },
      ])
    );
    let unassignedPaid = 0;
    let unassignedShare = 0;

    data.expenses.forEach((expense) => {
      const participants = expenseParticipants(expense, travelerNames);
      if (participants.length === 0) {
        unassignedShare += expense.amount;
      } else {
        const share = expense.amount / participants.length;
        participants.forEach((name) => {
          const row = travelers.get(name);
          if (!row) return;
          row.totalShare += share;
          if (expense.paidStatus === "betaald") row.paidShare += share;
          else row.openShare += share;
        });
      }

      if (expense.paidStatus === "betaald") {
        const payer = travelers.get(expense.paidBy);
        if (payer) payer.advanced += expense.amount;
        else unassignedPaid += expense.amount;
      }
    });

    return {
      total,
      paid,
      open: total - paid,
      categoryTotals,
      travelers: Array.from(travelers.values()),
      unassignedPaid,
      unassignedShare,
    };
  }, [data.expenses, travelerNames]);

  const budget = trip?.totalBudget ?? 0;
  const budgetPercentage = budget > 0 ? Math.min(100, (summary.total / budget) * 100) : 0;
  const remainingBudget = budget - summary.total;

  const setTotalBudget = (rawValue: string) => {
    setData((current) => ({
      ...current,
      trip: current.trip
        ? {
            ...current.trip,
            totalBudget: rawValue === "" ? undefined : Math.max(0, Number(rawValue) || 0),
          }
        : null,
    }));
  };

  const setCategoryBudget = (category: ExpenseCategory, rawValue: string) => {
    setData((current) => {
      const categoryBudgets = { ...(current.categoryBudgets ?? {}) };
      if (rawValue === "") delete categoryBudgets[category];
      else categoryBudgets[category] = Math.max(0, Number(rawValue) || 0);
      return { ...current, categoryBudgets };
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Wallet size={17} />
            Totaal gepland
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(summary.total, trip?.currency)}
          </p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Banknote size={17} />
            Al betaald
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(summary.paid, trip?.currency)}
          </p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CircleDollarSign size={17} />
            Nog te betalen
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatMoney(summary.open, trip?.currency)}
          </p>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <PieChart size={17} />
            Gemiddeld per reiziger
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(
              travelerNames.length ? summary.total / travelerNames.length : summary.total,
              trip?.currency
            )}
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <h3 className="text-base font-bold text-slate-950">Totaalbudget</h3>
            <p className="mt-1 text-sm text-slate-500">
              {budget > 0
                ? remainingBudget >= 0
                  ? `${formatMoney(remainingBudget, trip?.currency)} ruimte over`
                  : `${formatMoney(Math.abs(remainingBudget), trip?.currency)} boven budget`
                : "Stel een totaalbudget in om de voortgang te volgen."}
            </p>
          </div>
          <label>
            <span className="label">Limiet voor de hele reis</span>
            <input
              aria-label="Totaalbudget"
              className="input mt-1"
              min={0}
              step="0.01"
              type="number"
              value={trip?.totalBudget ?? ""}
              onChange={(event) => setTotalBudget(event.target.value)}
              placeholder="Nog niet ingesteld"
            />
          </label>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              budget > 0 && summary.total > budget ? "bg-rose-500" : "bg-mint-500"
            }`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>
        {budget > 0 ? (
          <p className="mt-2 text-right text-xs font-semibold text-slate-500">
            {Math.round((summary.total / budget) * 100)}% gebruikt
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel">
          <div>
            <h3 className="text-base font-bold text-slate-950">Budget per categorie</h3>
            <p className="mt-1 text-sm text-slate-500">
              Stel alleen limieten in voor categorieën die je wilt bewaken.
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {expenseCategories.map((category) => {
              const amount = summary.categoryTotals[category];
              const target = data.categoryBudgets?.[category];
              const progress = target && target > 0 ? Math.min(100, (amount / target) * 100) : 0;
              const overBudget = target !== undefined && amount > target;
              return (
                <div className="rounded-lg border border-slate-100 p-3" key={category}>
                  <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-end">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">{category}</span>
                        <span className="text-sm font-bold text-slate-950">
                          {formatMoney(amount, trip?.currency)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${overBudget ? "bg-rose-500" : "bg-mint-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <label>
                      <span className="label">Categorielimiet</span>
                      <input
                        aria-label={`Budget voor ${category}`}
                        className="input mt-1"
                        min={0}
                        step="0.01"
                        type="number"
                        value={target ?? ""}
                        onChange={(event) => setCategoryBudget(category, event.target.value)}
                        placeholder="Geen limiet"
                      />
                    </label>
                  </div>
                  {target !== undefined ? (
                    <p className={`mt-2 text-xs font-semibold ${overBudget ? "text-rose-700" : "text-slate-500"}`}>
                      {overBudget
                        ? `${formatMoney(amount - target, trip?.currency)} boven de categorielimiet`
                        : `${formatMoney(target - amount, trip?.currency)} beschikbaar`}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3 className="text-base font-bold text-slate-950">Verdeling per reiziger</h3>
          <p className="mt-1 text-sm text-slate-500">
            Saldo rekent alleen met betaalde kosten: positief betekent terugkrijgen, negatief betekent bijbetalen.
          </p>
          {summary.travelers.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3">Reiziger</th>
                    <th className="px-3 pb-2 text-right">Aandeel totaal</th>
                    <th className="px-3 pb-2 text-right">Voorgeschoten</th>
                    <th className="px-3 pb-2 text-right">Open aandeel</th>
                    <th className="pb-2 pl-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.travelers.map((traveler) => {
                    const balance = traveler.advanced - traveler.paidShare;
                    return (
                      <tr key={traveler.name}>
                        <th className="py-3 pr-3 font-semibold text-slate-900">{traveler.name}</th>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {formatMoney(traveler.totalShare, trip?.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {formatMoney(traveler.advanced, trip?.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {formatMoney(traveler.openShare, trip?.currency)}
                        </td>
                        <td
                          className={`py-3 pl-3 text-right font-bold ${
                            balance > 0.005
                              ? "text-emerald-700"
                              : balance < -0.005
                                ? "text-amber-700"
                                : "text-slate-600"
                          }`}
                        >
                          {balance > 0.005 ? "+" : ""}
                          {formatMoney(balance, trip?.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              Voeg reizigers toe aan de reisgegevens om de verdeling te zien.
            </p>
          )}

          {summary.unassignedPaid > 0 || summary.unassignedShare > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Sommige kosten zijn nog niet volledig aan reizigers gekoppeld.
              {summary.unassignedPaid > 0
                ? ` Betaler onbekend: ${formatMoney(summary.unassignedPaid, trip?.currency)}.`
                : ""}
              {summary.unassignedShare > 0
                ? ` Verdeling onbekend: ${formatMoney(summary.unassignedShare, trip?.currency)}.`
                : ""}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
