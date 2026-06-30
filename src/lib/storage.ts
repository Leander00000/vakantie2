import { createDefaultPackingCategories, createEmptyData } from "../data/emptyTrip";
import type { AppData } from "../types";

const STORAGE_KEY = "reisplanner:data:v1";

const isBrowser = typeof window !== "undefined";

export const loadData = (): AppData => {
  if (!isBrowser) return createEmptyData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();
    return normalizeData(JSON.parse(raw));
  } catch {
    return createEmptyData();
  }
};

export const saveData = (data: AppData) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearData = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const normalizeData = (value: unknown): AppData => {
  const incoming = value as Partial<AppData> | null;
  const empty = createEmptyData();

  if (!incoming || typeof incoming !== "object") {
    return empty;
  }

  return {
    trip: incoming.trip ?? null,
    destinations: Array.isArray(incoming.destinations)
      ? incoming.destinations.map((destination) => ({
          ...destination,
          nights: destination.nights ?? 0,
        }))
      : [],
    transports: Array.isArray(incoming.transports)
      ? incoming.transports.map((transport) => ({
          ...transport,
          documentIds: Array.isArray(transport.documentIds) ? transport.documentIds : [],
          cost: transport.cost ?? 0,
        }))
      : [],
    dayPlans: Array.isArray(incoming.dayPlans)
      ? incoming.dayPlans.map((day) => ({
          ...day,
          transportIds: Array.isArray(day.transportIds) ? day.transportIds : [],
          documentIds: Array.isArray(day.documentIds) ? day.documentIds : [],
          expenseIds: Array.isArray(day.expenseIds) ? day.expenseIds : [],
          meals: day.meals ?? "",
          estimatedCost: day.estimatedCost ?? 0,
        }))
      : [],
    expenses: Array.isArray(incoming.expenses)
      ? incoming.expenses.map((expense) => ({
          ...expense,
          documentIds: Array.isArray(expense.documentIds) ? expense.documentIds : [],
          amount: expense.amount ?? 0,
        }))
      : [],
    packingCategories: Array.isArray(incoming.packingCategories)
      ? incoming.packingCategories
      : incoming.trip
        ? createDefaultPackingCategories()
        : [],
    packingItems: Array.isArray(incoming.packingItems) ? incoming.packingItems : [],
    documents: Array.isArray(incoming.documents)
      ? incoming.documents.map((document) => ({
          ...document,
          linkedDayId: document.linkedDayId ?? "",
          linkedDestinationId: document.linkedDestinationId ?? "",
          linkedExpenseId: document.linkedExpenseId ?? "",
        }))
      : [],
  };
};

export const exportData = (data: AppData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reisplanner-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
