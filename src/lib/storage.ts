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
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

export const clearData = () => {
  if (!isBrowser) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isOptionalString = (record: UnknownRecord, key: string) =>
  !(key in record) || isString(record[key]);
const isOptionalNumber = (record: UnknownRecord, key: string) =>
  !(key in record) || record[key] === undefined || isFiniteNumber(record[key]);
const isOptionalStringArray = (record: UnknownRecord, key: string) =>
  !(key in record) || isStringArray(record[key]);

const hasStrings = (record: UnknownRecord, keys: string[]) =>
  keys.every((key) => isString(record[key]));

const isTrip = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, ["id", "name", "startDate", "endDate", "currency", "notes"]) &&
    isFiniteNumber(value.travelers) &&
    value.travelers >= 1 &&
    value.travelers <= 20 &&
    Number.isInteger(value.travelers) &&
    isOptionalStringArray(value, "travelerNames") &&
    isOptionalNumber(value, "totalBudget")
  );
};

const isDestination = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "name",
      "type",
      "arrivalDate",
      "departureDate",
      "accommodationStatus",
      "transportStatus",
      "accommodationLink",
      "transportLink",
      "notes",
    ]) &&
    isFiniteNumber(value.nights) &&
    [
      "accommodationName",
      "accommodationAddress",
      "accommodationReference",
      "checkInTime",
      "checkOutTime",
    ].every((key) => isOptionalString(value, key))
  );
};

const isTransport = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "from",
      "to",
      "mode",
      "routeDescription",
      "departureDate",
      "arrivalDate",
      "status",
      "bookingLink",
      "notes",
    ]) &&
    isFiniteNumber(value.cost) &&
    isStringArray(value.documentIds) &&
    [
      "fromDestinationId",
      "toDestinationId",
      "departureTime",
      "arrivalTime",
      "provider",
      "bookingReference",
    ].every((key) => isOptionalString(value, key))
  );
};

const isDayPlan = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "date",
      "location",
      "dayType",
      "accommodation",
      "activities",
      "meals",
      "bookingStatus",
      "notes",
      "status",
    ]) &&
    isFiniteNumber(value.dayNumber) &&
    isFiniteNumber(value.estimatedCost) &&
    isStringArray(value.transportIds) &&
    isStringArray(value.documentIds) &&
    isStringArray(value.expenseIds) &&
    isOptionalStringArray(value, "activityIds")
  );
};

const isExpense = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "title",
      "category",
      "currency",
      "paidStatus",
      "paidBy",
      "dayId",
      "destinationId",
      "bookingLink",
      "notes",
    ]) &&
    isFiniteNumber(value.amount) &&
    isBoolean(value.split) &&
    isStringArray(value.documentIds) &&
    isOptionalStringArray(value, "splitBetween")
  );
};

const isPackingCategory = (value: unknown) =>
  isRecord(value) && hasStrings(value, ["id", "name"]);

const isPackingItem = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, ["id", "name", "categoryId", "notes"]) &&
    isFiniteNumber(value.quantity) &&
    isBoolean(value.packed) &&
    isBoolean(value.essential) &&
    isOptionalStringArray(value, "assignedTo")
  );
};

const isTravelDocument = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "fileName",
      "fileType",
      "documentType",
      "linkedDayId",
      "linkedDestinationId",
      "linkedExpenseId",
      "uploadedAt",
      "notes",
      "fileBlobKey",
    ]) &&
    isOptionalString(value, "linkedTransportId") &&
    isOptionalNumber(value, "size")
  );
};

const isActivity = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    hasStrings(value, [
      "id",
      "title",
      "destinationId",
      "location",
      "category",
      "priority",
      "status",
      "bookingLink",
      "notes",
    ]) && isFiniteNumber(value.estimatedCost)
  );
};

/**
 * Accepts both the original raw AppData export and the current data shape.
 * Newer fields are optional here and are filled by normalizeData afterwards.
 */
export const isImportableAppData = (value: unknown): value is Partial<AppData> => {
  if (!isRecord(value)) return false;
  if (!(value.trip === null || isTrip(value.trip))) return false;

  const requiredCollections: Array<[string, (entry: unknown) => boolean]> = [
    ["destinations", isDestination],
    ["transports", isTransport],
    ["dayPlans", isDayPlan],
    ["expenses", isExpense],
    ["packingCategories", isPackingCategory],
    ["packingItems", isPackingItem],
    ["documents", isTravelDocument],
  ];

  if (
    !requiredCollections.every(
      ([key, validator]) => Array.isArray(value[key]) && value[key].every(validator)
    )
  ) {
    return false;
  }

  if ("activities" in value && (!Array.isArray(value.activities) || !value.activities.every(isActivity))) {
    return false;
  }

  return !(
    "categoryBudgets" in value &&
    (!isRecord(value.categoryBudgets) ||
      !Object.values(value.categoryBudgets).every(isFiniteNumber))
  );
};

export const normalizeData = (value: unknown): AppData => {
  const incoming = value as Partial<AppData> | null;
  const empty = createEmptyData();

  if (!incoming || typeof incoming !== "object") {
    return empty;
  }

  const travelerCount = incoming.trip
    ? Math.max(1, Math.min(20, Number(incoming.trip.travelers) || 1))
    : 0;
  const usedTravelerNames = new Set<string>();
  const travelerNames = incoming.trip
    ? Array.from({ length: travelerCount }, (_, index) => {
        const baseName = incoming.trip?.travelerNames?.[index]?.trim() || `Reiziger ${index + 1}`;
        let candidate = baseName;
        let suffix = 2;
        while (usedTravelerNames.has(candidate.toLocaleLowerCase("nl-NL"))) {
          candidate = `${baseName} (${suffix})`;
          suffix += 1;
        }
        usedTravelerNames.add(candidate.toLocaleLowerCase("nl-NL"));
        return candidate;
      })
    : [];
  const trip = incoming.trip
    ? {
        ...incoming.trip,
        travelers: travelerCount,
        travelerNames,
      }
    : null;
  const tripCurrency = trip?.currency || "EUR";

  return {
    trip,
    destinations: Array.isArray(incoming.destinations)
        ? incoming.destinations.map((destination) => ({
          ...destination,
          nights: destination.nights ?? 0,
          accommodationName: destination.accommodationName ?? "",
          accommodationAddress: destination.accommodationAddress ?? "",
          accommodationReference: destination.accommodationReference ?? "",
          checkInTime: destination.checkInTime ?? "",
          checkOutTime: destination.checkOutTime ?? "",
        }))
      : [],
    transports: Array.isArray(incoming.transports)
      ? incoming.transports.map((transport) => ({
          ...transport,
          documentIds: Array.isArray(transport.documentIds) ? transport.documentIds : [],
          cost: transport.cost ?? 0,
          fromDestinationId: transport.fromDestinationId ?? "",
          toDestinationId: transport.toDestinationId ?? "",
          departureTime: transport.departureTime ?? "",
          arrivalTime: transport.arrivalTime ?? "",
          provider: transport.provider ?? "",
          bookingReference: transport.bookingReference ?? "",
        }))
      : [],
    dayPlans: Array.isArray(incoming.dayPlans)
      ? incoming.dayPlans.map((day) => ({
          ...day,
          transportIds: Array.isArray(day.transportIds) ? day.transportIds : [],
          activityIds: Array.isArray(day.activityIds) ? day.activityIds : [],
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
          currency: tripCurrency,
          splitBetween: Array.isArray(expense.splitBetween) ? expense.splitBetween : [],
        }))
      : [],
    activities: Array.isArray(incoming.activities)
      ? incoming.activities.map((activity) => ({
          ...activity,
          destinationId: activity.destinationId ?? "",
          location: activity.location ?? "",
          category: activity.category ?? "Overig",
          priority: activity.priority ?? "misschien",
          status: activity.status ?? "idee",
          estimatedCost: activity.estimatedCost ?? 0,
          bookingLink: activity.bookingLink ?? "",
          notes: activity.notes ?? "",
        }))
      : [],
    categoryBudgets:
      incoming.categoryBudgets && typeof incoming.categoryBudgets === "object"
        ? incoming.categoryBudgets
        : {},
    packingCategories: Array.isArray(incoming.packingCategories)
      ? incoming.packingCategories
      : incoming.trip
        ? createDefaultPackingCategories()
        : [],
    packingItems: Array.isArray(incoming.packingItems)
      ? incoming.packingItems.map((item) => ({
          ...item,
          assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : [],
        }))
      : [],
    documents: Array.isArray(incoming.documents)
      ? incoming.documents.map((document) => ({
          ...document,
          linkedDayId: document.linkedDayId ?? "",
          linkedDestinationId: document.linkedDestinationId ?? "",
          linkedExpenseId: document.linkedExpenseId ?? "",
          linkedTransportId: document.linkedTransportId ?? "",
          size: document.size ?? 0,
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
