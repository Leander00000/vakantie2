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

export type ActivityCategory =
  | "Natuur"
  | "Wandeling"
  | "Bezienswaardigheid"
  | "Eten & drinken"
  | "Cultuur"
  | "Ontspanning"
  | "Overig";
export type ActivityPriority = "misschien" | "graag" | "must-do";
export type ActivityStatus = "idee" | "shortlist" | "gepland" | "geboekt";

export type TabKey = "planner" | "budget" | "packing" | "documents";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelerNames: string[];
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
  accommodationName: string;
  accommodationAddress: string;
  accommodationReference: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  location: string;
  dayType: DayType;
  transportIds: string[];
  activityIds: string[];
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
  fromDestinationId: string;
  toDestinationId: string;
  mode: TransportMode;
  routeDescription: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  provider: string;
  bookingReference: string;
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
  splitBetween: string[];
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
  assignedTo: string[];
  notes: string;
}

export interface ActivityIdea {
  id: string;
  title: string;
  destinationId: string;
  location: string;
  category: ActivityCategory;
  priority: ActivityPriority;
  status: ActivityStatus;
  estimatedCost: number;
  bookingLink: string;
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
  linkedTransportId: string;
  uploadedAt: string;
  notes: string;
  fileBlobKey: string;
  size: number;
}

export interface AppData {
  trip: Trip | null;
  destinations: Destination[];
  transports: Transport[];
  dayPlans: DayPlan[];
  expenses: Expense[];
  activities: ActivityIdea[];
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
  packingCategories: PackingCategory[];
  packingItems: PackingItem[];
  documents: TravelDocument[];
}

export interface TripSetupInput {
  name: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelerNames: string[];
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

export const activityCategories: ActivityCategory[] = [
  "Natuur",
  "Wandeling",
  "Bezienswaardigheid",
  "Eten & drinken",
  "Cultuur",
  "Ontspanning",
  "Overig",
];

export const activityPriorities: ActivityPriority[] = ["misschien", "graag", "must-do"];
export const activityStatuses: ActivityStatus[] = ["idee", "shortlist", "gepland", "geboekt"];

export const currencies = ["EUR", "USD", "GBP", "CHF", "NOK", "SEK", "DKK"];
