import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Banknote, Edit2, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatMoney } from "../../data/emptyTrip";
import type { AppData, Expense } from "../../types";
import { ExpenseForm } from "./ExpenseForm";

interface ExpenseListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  filteredExpenses: Expense[];
}

export const ExpenseList = ({ data, setData, filteredExpenses }: ExpenseListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const upsertExpense = (expense: Expense) => {
    setData((current) => {
      const exists = current.expenses.some((item) => item.id === expense.id);
      return {
        ...current,
        expenses: exists
          ? current.expenses.map((item) => (item.id === expense.id ? expense : item))
          : [...current.expenses, expense],
        dayPlans: current.dayPlans.map((day) => ({
          ...day,
          expenseIds:
            day.id === expense.dayId
              ? Array.from(new Set([...day.expenseIds, expense.id]))
              : day.expenseIds.filter((expenseId) => expenseId !== expense.id),
        })),
        documents: current.documents.map((document) => {
          if (expense.documentIds.includes(document.id)) return { ...document, linkedExpenseId: expense.id };
          if (document.linkedExpenseId === expense.id) return { ...document, linkedExpenseId: "" };
          return document;
        }),
      };
    });
    setShowForm(false);
    setEditingExpense(undefined);
  };

  const deleteExpense = (id: string) => {
    if (!window.confirm("Deze uitgave verwijderen?")) return;
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        expenseIds: day.expenseIds.filter((expenseId) => expenseId !== id),
      })),
      documents: current.documents.map((document) =>
        document.linkedExpenseId === id ? { ...document, linkedExpenseId: "" } : document
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Uitgaven</h3>
          <p className="text-sm text-slate-500">Voeg alleen kosten toe die je zelf wilt bijhouden.</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            setEditingExpense(undefined);
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Uitgave toevoegen
        </button>
      </div>

      {showForm ? (
        <ExpenseForm
          data={data}
          initial={editingExpense}
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(undefined);
          }}
          onSubmit={upsertExpense}
        />
      ) : null}

      {data.expenses.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Er zijn nog geen uitgaven toegevoegd."
          actionLabel="Uitgave toevoegen"
          onAction={() => setShowForm(true)}
        />
      ) : filteredExpenses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Geen uitgaven gevonden met deze filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Bedrag</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dag</th>
                <th className="px-4 py-3">Bestemming</th>
                <th className="px-4 py-3">Documenten</th>
                <th className="px-4 py-3">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => {
                const day = data.dayPlans.find((item) => item.id === expense.dayId);
                const destination = data.destinations.find((item) => item.id === expense.destinationId);
                return (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{expense.title}</td>
                    <td className="px-4 py-3 text-slate-600">{expense.category}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(expense.amount, expense.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={expense.paidStatus === "betaald" ? "betaald" : "openstaand"} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {day ? `Dag ${day.dayNumber} · ${formatDate(day.date)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{destination?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{expense.documentIds.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="icon-btn"
                          type="button"
                          title="Uitgave bewerken"
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="icon-btn text-rose-600"
                          type="button"
                          title="Uitgave verwijderen"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
