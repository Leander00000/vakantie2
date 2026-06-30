import type { AppData, DayPlan, PackingCategory, Trip, TripSetupInput } from "../types";

export const defaultPackingCategoryNames = [
  "Kleding",
  "Toiletspullen",
  "Documenten & geld",
  "Elektronica",
  "Reisbenodigdheden",
  "Activiteiten",
  "Overig",
];

export const createId = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const createDefaultPackingCategories = (): PackingCategory[] =>
  defaultPackingCategoryNames.map((name) => ({
    id: createId("cat"),
    name,
  }));

export const createEmptyData = (): AppData => ({
  trip: null,
  destinations: [],
  transports: [],
  dayPlans: [],
  expenses: [],
  packingCategories: [],
  packingItems: [],
  documents: [],
});

export const createTrip = (input: TripSetupInput): Trip => ({
  id: createId("trip"),
  name: input.name.trim(),
  startDate: input.startDate,
  endDate: input.endDate,
  travelers: Math.max(1, input.travelers || 1),
  currency: input.currency || "EUR",
  totalBudget: input.totalBudget,
  notes: input.notes.trim(),
});

export const dateToInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const daysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
};

export const calculateNights = (arrivalDate: string, departureDate: string) =>
  daysBetween(arrivalDate, departureDate);

export const formatDate = (value: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

export const formatMoney = (amount: number, currency = "EUR") =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);

export const createEmptyDay = (date: string, dayNumber: number): DayPlan => ({
  id: createId("day"),
  dayNumber,
  date,
  location: "",
  dayType: "",
  transportIds: [],
  accommodation: "",
  activities: "",
  meals: "",
  estimatedCost: 0,
  bookingStatus: "geen",
  documentIds: [],
  expenseIds: [],
  notes: "",
  status: "leeg",
});

export const generateDayPlans = (
  startDate: string,
  endDate: string,
  existingDays: DayPlan[] = []
) => {
  if (!startDate || !endDate) return [];
  const dayCount = daysBetween(startDate, endDate);
  if (dayCount < 0) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const existingByDate = new Map(existingDays.map((day) => [day.date, day]));

  return Array.from({ length: dayCount + 1 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const date = dateToInputValue(current);
    const existing = existingByDate.get(date);
    return existing ? { ...existing, dayNumber: index + 1, date } : createEmptyDay(date, index + 1);
  });
};

export const createDataForTrip = (input: TripSetupInput): AppData => {
  const trip = createTrip(input);
  return {
    ...createEmptyData(),
    trip,
    dayPlans: generateDayPlans(trip.startDate, trip.endDate),
    packingCategories: createDefaultPackingCategories(),
  };
};
