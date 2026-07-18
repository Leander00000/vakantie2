import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Lightbulb,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { createId, formatDate } from "../../data/emptyTrip";
import {
  activityCategories,
  activityPriorities,
  activityStatuses,
  type ActivityCategory,
  type ActivityIdea,
  type ActivityPriority,
  type ActivityStatus,
  type AppData,
} from "../../types";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";

interface ActivityIdeasProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

type CategoryFilter = ActivityCategory | "alle";
type PriorityFilter = ActivityPriority | "alle";
type StatusFilter = ActivityStatus | "alle";

const createEmptyActivity = (): ActivityIdea => ({
  id: createId("activity"),
  title: "",
  destinationId: "",
  location: "",
  category: "Overig",
  priority: "misschien",
  status: "idee",
  estimatedCost: 0,
  bookingLink: "",
  notes: "",
});

const priorityTone = (priority: ActivityPriority) => {
  if (priority === "must-do") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "graag") return "border-mint-200 bg-mint-50 text-mint-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const isValidWebLink = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export const ActivityIdeas = ({ data, setData }: ActivityIdeasProps) => {
  const activities = data.activities ?? [];
  const [search, setSearch] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("alle");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("alle");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("alle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");
  const [form, setForm] = useState<ActivityIdea>(() => createEmptyActivity());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

  const currency = data.trip?.currency || "EUR";
  const money = useMemo(
    () => new Intl.NumberFormat("nl-NL", { style: "currency", currency }),
    [currency]
  );
  const destinationNames = useMemo(
    () => new Map(data.destinations.map((destination) => [destination.id, destination.name])),
    [data.destinations]
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("nl-NL");

    return activities.filter((activity) => {
      const destinationName = destinationNames.get(activity.destinationId) ?? "";
      const matchesSearch =
        !query ||
        [activity.title, activity.location, activity.notes, destinationName]
          .join(" ")
          .toLocaleLowerCase("nl-NL")
          .includes(query);
      const matchesDestination =
        destinationFilter === "alle" || activity.destinationId === destinationFilter;
      const matchesCategory = categoryFilter === "alle" || activity.category === categoryFilter;
      const matchesPriority = priorityFilter === "alle" || activity.priority === priorityFilter;
      const matchesStatus = statusFilter === "alle" || activity.status === statusFilter;

      return (
        matchesSearch &&
        matchesDestination &&
        matchesCategory &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    activities,
    categoryFilter,
    destinationFilter,
    destinationNames,
    priorityFilter,
    search,
    statusFilter,
  ]);

  const mustDoCount = activities.filter((activity) => activity.priority === "must-do").length;
  const committedCount = activities.filter(
    (activity) => activity.status === "gepland" || activity.status === "geboekt"
  ).length;
  const totalEstimate = activities.reduce((sum, activity) => sum + activity.estimatedCost, 0);
  const filtersActive =
    search.trim() !== "" ||
    destinationFilter !== "alle" ||
    categoryFilter !== "alle" ||
    priorityFilter !== "alle" ||
    statusFilter !== "alle";

  const openNewForm = () => {
    setEditingId(null);
    setForm(createEmptyActivity());
    setError("");
    setFormOpen(true);
  };

  const editActivity = (activity: ActivityIdea) => {
    setEditingId(activity.id);
    setForm({ ...createEmptyActivity(), ...activity });
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(createEmptyActivity());
    setError("");
    setFormOpen(false);
  };

  const submitActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    const bookingLink = form.bookingLink.trim();
    const estimatedCost = Number(form.estimatedCost);

    if (!title) {
      setError("Geef het activiteitenidee een naam.");
      return;
    }
    if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
      setError("Vul een geldig kostenbedrag van 0 of meer in.");
      return;
    }
    if (bookingLink && !isValidWebLink(bookingLink)) {
      setError("De link moet beginnen met http:// of https://.");
      return;
    }

    const activity: ActivityIdea = {
      ...form,
      title,
      location: form.location.trim(),
      estimatedCost,
      bookingLink,
      notes: form.notes.trim(),
    };

    setData((current) => ({
      ...current,
      activities: editingId
        ? (current.activities ?? []).map((item) => (item.id === editingId ? activity : item))
        : [...(current.activities ?? []), activity],
    }));
    closeForm();
  };

  const deleteActivity = (activity: ActivityIdea) => {
    if (!window.confirm(`Activiteit “${activity.title}” verwijderen?`)) return;
    setData((current) => ({
      ...current,
      activities: (current.activities ?? []).filter((item) => item.id !== activity.id),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        activityIds: day.activityIds.filter((activityId) => activityId !== activity.id),
      })),
    }));
    if (editingId === activity.id) closeForm();
  };

  const clearFilters = () => {
    setSearch("");
    setDestinationFilter("alle");
    setCategoryFilter("alle");
    setPriorityFilter("alle");
    setStatusFilter("alle");
  };

  const selectDestination = (destinationId: string) => {
    const destinationName = destinationNames.get(destinationId) ?? "";
    setForm((current) => ({
      ...current,
      destinationId,
      location: current.location || destinationName,
    }));
  };

  return (
    <section className="space-y-5" aria-labelledby="activity-ideas-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-950" id="activity-ideas-title">
            Activiteitenideeën
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Verzamel opties, maak een shortlist en beslis later wat echt in de planning komt.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={openNewForm}>
          <Plus size={16} />
          Activiteit toevoegen
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4">
          <p className="label">Alle ideeën</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{activities.length}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Must-do</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{mustDoCount}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Gepland of geboekt</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{committedCount}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Kostenindicatie</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{money.format(totalEstimate)}</p>
        </div>
      </div>

      {formOpen ? (
        <form className="panel space-y-4" onSubmit={submitActivity}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-slate-950">
                {editingId ? "Activiteit bewerken" : "Nieuw activiteitenidee"}
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Alleen de naam is verplicht; de rest kun je later aanvullen.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="md:col-span-2">
              <span className="label">Naam activiteit</span>
              <input
                className="input mt-1"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Wat lijkt jullie leuk?"
                autoFocus
              />
            </label>

            <label>
              <span className="label">Bestemming</span>
              <select
                className="input mt-1"
                value={form.destinationId}
                onChange={(event) => selectDestination(event.target.value)}
              >
                <option value="">Niet gekoppeld</option>
                {data.destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Plaats of gebied</span>
              <input
                className="input mt-1"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Optionele locatie"
              />
            </label>

            <label>
              <span className="label">Categorie</span>
              <select
                className="input mt-1"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as ActivityCategory })
                }
              >
                {activityCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Prioriteit</span>
              <select
                className="input mt-1"
                value={form.priority}
                onChange={(event) =>
                  setForm({ ...form, priority: event.target.value as ActivityPriority })
                }
              >
                {activityPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Status</span>
              <select
                className="input mt-1"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ActivityStatus })
                }
              >
                {activityStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Geschatte kosten</span>
              <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-mint-200">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                  {currency}
                </span>
                <input
                  className="min-w-0 flex-1 px-3 py-2 text-sm text-slate-800 outline-none"
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.estimatedCost}
                  onChange={(event) =>
                    setForm({ ...form, estimatedCost: Number(event.target.value) })
                  }
                />
              </div>
            </label>

            <label className="md:col-span-2">
              <span className="label">Informatie- of boekingslink</span>
              <input
                className="input mt-1"
                type="url"
                value={form.bookingLink}
                onChange={(event) => setForm({ ...form, bookingLink: event.target.value })}
                placeholder="https://"
              />
            </label>

            <label className="md:col-span-2 xl:col-span-4">
              <span className="label">Notities</span>
              <textarea
                className="input mt-1 min-h-24"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Bijvoorbeeld openingstijden, moeilijkheid of waarom dit op de lijst staat"
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm font-semibold text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={closeForm}>
              Annuleren
            </button>
            <button className="btn-primary" type="submit">
              {editingId ? "Wijzigingen opslaan" : "Activiteit opslaan"}
            </button>
          </div>
        </form>
      ) : null}

      {activities.length ? (
        <div className="panel space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="relative md:col-span-2 xl:col-span-1">
              <span className="label">Zoeken</span>
              <Search
                className="pointer-events-none absolute bottom-2.5 left-3 text-slate-400"
                size={16}
              />
              <input
                className="input mt-1 pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Naam, plek of notitie"
                type="search"
              />
            </label>

            <label>
              <span className="label">Bestemming</span>
              <select
                className="input mt-1"
                value={destinationFilter}
                onChange={(event) => setDestinationFilter(event.target.value)}
              >
                <option value="alle">Alle bestemmingen</option>
                <option value="">Niet gekoppeld</option>
                {data.destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Categorie</span>
              <select
                className="input mt-1"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
              >
                <option value="alle">Alle categorieën</option>
                {activityCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Prioriteit</span>
              <select
                className="input mt-1"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
              >
                <option value="alle">Alle prioriteiten</option>
                {activityPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Status</span>
              <select
                className="input mt-1"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="alle">Alle statussen</option>
                {activityStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtersActive ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-500">
                {filteredActivities.length} van {activities.length} zichtbaar
              </p>
              <button className="text-sm font-semibold text-mint-700 hover:text-mint-900" type="button" onClick={clearFilters}>
                Filters wissen
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!activities.length ? (
        <EmptyState
          icon={Lightbulb}
          title="Nog geen activiteitenideeën"
          description="Bewaar hier zelf alles wat je onderweg misschien wilt doen. Je hoeft nog niets definitief te plannen."
          actionLabel={formOpen ? undefined : "Eerste activiteit toevoegen"}
          onAction={formOpen ? undefined : openNewForm}
        />
      ) : null}

      {activities.length && !filteredActivities.length ? (
        <EmptyState
          icon={Search}
          title="Geen activiteiten gevonden"
          description="Er passen geen ideeën bij je huidige zoekterm en filters."
          actionLabel="Filters wissen"
          onAction={clearFilters}
        />
      ) : null}

      {filteredActivities.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredActivities.map((activity) => {
            const destinationName = destinationNames.get(activity.destinationId);
            const shownLocation = destinationName || activity.location;
            const linkedDay = data.dayPlans.find((day) => day.activityIds.includes(activity.id));

            return (
              <article className="panel flex min-h-52 flex-col" key={activity.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {activity.category}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityTone(
                          activity.priority
                        )}`}
                      >
                        {activity.priority}
                      </span>
                      <StatusBadge status={activity.status} />
                    </div>
                    <h4 className="mt-3 break-words text-lg font-bold text-slate-950">
                      {activity.title}
                    </h4>
                    {shownLocation ? (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="shrink-0" size={15} />
                        <span className="truncate">{shownLocation}</span>
                        {destinationName && activity.location && activity.location !== destinationName
                          ? ` · ${activity.location}`
                          : null}
                      </p>
                    ) : null}
                    {linkedDay ? (
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-mint-700">
                        <CalendarDays className="shrink-0" size={15} />
                        Dag {linkedDay.dayNumber} · {formatDate(linkedDay.date)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => editActivity(activity)}
                      title="Activiteit bewerken"
                      aria-label={`${activity.title} bewerken`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-btn border-rose-200 text-rose-700 hover:bg-rose-50"
                      type="button"
                      onClick={() => deleteActivity(activity)}
                      title="Activiteit verwijderen"
                      aria-label={`${activity.title} verwijderen`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {activity.notes ? (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {activity.notes}
                  </p>
                ) : (
                  <p className="mt-4 text-sm italic text-slate-400">Nog geen notities toegevoegd.</p>
                )}

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="label">Kostenindicatie</p>
                    <p className="mt-1 font-bold text-slate-900">
                      {money.format(activity.estimatedCost)}
                    </p>
                  </div>
                  {activity.bookingLink ? (
                    <a
                      className="btn-secondary"
                      href={activity.bookingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link openen
                      <ExternalLink size={15} />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
