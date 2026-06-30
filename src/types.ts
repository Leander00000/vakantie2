export type DestinationType = "startpunt" | "verblijfplaats" | "tussenstop" | "eindpunt";
export type StayStatus =
  | "nog zoeken"
  | "optie gevonden"
  | "geboekt"
  | "betaald"
  | "niet van toepassing";
export type TransportStatus = "nog zoeken" | "optie gevonden" | "geboekt" | "betaald";
export type TransportMode =
  | "trein"
  | "bus"
  | "boot"
  | "vliegtuig"
  | "taxi"
  | "auto"
  | "lopen"
  | "fiets"
  | "anders";
export type DayType =
  | ""
  | "reisdag"
  | "natuurdag"
  | "stadsdag"
  | "rustdag"
  | "activiteitendag"
  | "terugreis"
  | "anders";
export type DayStatus = "leeg" | "concept" | "gepland" | "definitief";
export type BookingStatus =
  | "geen"
  | "nog zoeken"
  | "optie gevonden"
  | "geboekt"
  | "betaald"
  | "openstaand"
  | "niet van toepassing";
export type ExpenseCategory =
  | "Verblijf"
  | "Vervoer"
  | "Activiteiten"
  | "Eten & drinken"
  | "Overig";
export type PaidStatus = "nog te betalen" | "betaald";
export type DocumentType =
  | "Treinticket"
  | "Vliegticket"
  | "Verblijfsboeking"
  | "Activiteitenboeking"
  | "Reisverzekering"
  | "Identiteitsdocument"
  | "Reservering"
  | "Overig";

export type TabKey = "planner" | "budget" | "packing" | "documents";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  travelers: number;
  currency: string;
  totalBudget?: number;
  notes: string;
}

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  accommodationStatus: StayStatus;
  transportStatus: StayStatus;
  accommodationLink: string;
  transportLink: string;
  notes: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  location: string;
  dayType: DayType;
  transportIds: string[];
  accommodation: string;
  activities: string;
  meals: string;
  estimatedCost: number;
  bookingStatus: BookingStatus;
  documentIds: string[];
  expenseIds: string[];
  notes: string;
  status: DayStatus;
}

export interface Transport {
  id: string;
  from: string;
  to: string;
  mode: TransportMode;
  routeDescription: string;
  departureDate: string;
  arrivalDate: string;
  status: TransportStatus;
  cost: number;
  bookingLink: string;
  documentIds: string[];
  notes: string;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paidStatus: PaidStatus;
  paidBy: string;
  split: boolean;
  dayId: string;
  destinationId: string;
  documentIds: string[];
  bookingLink: string;
  notes: string;
}

export interface PackingCategory {
  id: string;
  name: string;
}

export interface PackingItem {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  packed: boolean;
  essential: boolean;
  notes: string;
}

export interface TravelDocument {
  id: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  linkedDayId: string;
  linkedDestinationId: string;
  linkedExpenseId: string;
  uploadedAt: string;
  notes: string;
  fileBlobKey: string;
}

export interface AppData {
  trip: Trip | null;
  destinations: Destination[];
  transports: Transport[];
  dayPlans: DayPlan[];
  expenses: Expense[];
  packingCategories: PackingCategory[];
  packingItems: PackingItem[];
  documents: TravelDocument[];
}

export interface TripSetupInput {
  name: string;
  startDate: string;
  endDate: string;
  travelers: number;
  currency: string;
  totalBudget?: number;
  notes: string;
}

export const destinationTypes: DestinationType[] = [
  "startpunt",
  "verblijfplaats",
  "tussenstop",
  "eindpunt",
];

export const stayStatuses: StayStatus[] = [
  "nog zoeken",
  "optie gevonden",
  "geboekt",
  "betaald",
  "niet van toepassing",
];

export const transportStatuses: TransportStatus[] = [
  "nog zoeken",
  "optie gevonden",
  "geboekt",
  "betaald",
];

export const transportModes: TransportMode[] = [
  "trein",
  "bus",
  "boot",
  "vliegtuig",
  "taxi",
  "auto",
  "lopen",
  "fiets",
  "anders",
];

export const dayTypes: DayType[] = [
  "",
  "reisdag",
  "natuurdag",
  "stadsdag",
  "rustdag",
  "activiteitendag",
  "terugreis",
  "anders",
];

export const dayStatuses: DayStatus[] = ["leeg", "concept", "gepland", "definitief"];

export const bookingStatuses: BookingStatus[] = [
  "geen",
  "nog zoeken",
  "optie gevonden",
  "geboekt",
  "betaald",
  "openstaand",
  "niet van toepassing",
];

export const expenseCategories: ExpenseCategory[] = [
  "Verblijf",
  "Vervoer",
  "Activiteiten",
  "Eten & drinken",
  "Overig",
];

export const documentTypes: DocumentType[] = [
  "Treinticket",
  "Vliegticket",
  "Verblijfsboeking",
  "Activiteitenboeking",
  "Reisverzekering",
  "Identiteitsdocument",
  "Reservering",
  "Overig",
];

export const currencies = ["EUR", "USD", "GBP", "CHF", "NOK", "SEK", "DKK"];
