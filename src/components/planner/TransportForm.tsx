import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import {
  transportModes,
  transportStatuses,
  type Destination,
  type Transport,
  type TransportMode,
  type TransportStatus,
  type TravelDocument,
} from "../../types";

interface TransportFormProps {
  destinations: Destination[];
  documents: TravelDocument[];
  initial?: Transport;
  defaultFrom?: string;
  defaultTo?: string;
  defaultFromDestinationId?: string;
  defaultToDestinationId?: string;
  onSubmit: (transport: Transport) => void;
  onCancel: () => void;
}

const createEmptyTransport = (
  defaultFrom = "",
  defaultTo = "",
  defaultFromDestinationId = "",
  defaultToDestinationId = ""
): Transport => ({
  id: createId("transport"),
  from: defaultFrom,
  to: defaultTo,
  fromDestinationId: defaultFromDestinationId,
  toDestinationId: defaultToDestinationId,
  mode: "trein",
  routeDescription: "",
  departureDate: "",
  arrivalDate: "",
  departureTime: "",
  arrivalTime: "",
  provider: "",
  bookingReference: "",
  status: "nog zoeken",
  cost: 0,
  bookingLink: "",
  documentIds: [],
  notes: "",
});

export const TransportForm = ({
  destinations,
  documents,
  initial,
  defaultFrom,
  defaultTo,
  defaultFromDestinationId,
  defaultToDestinationId,
  onSubmit,
  onCancel,
}: TransportFormProps) => {
  const [form, setForm] = useState<Transport>(() => ({
    ...createEmptyTransport(
      defaultFrom,
      defaultTo,
      defaultFromDestinationId,
      defaultToDestinationId
    ),
    ...initial,
  }));
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.from.trim() || !form.to.trim()) {
      setError("Vul een vertrekpunt en aankomstpunt in.");
      return;
    }
    if (form.departureDate && form.arrivalDate && form.arrivalDate < form.departureDate) {
      setError("De aankomstdatum kan niet vóór de vertrekdatum liggen.");
      return;
    }
    if (
      form.departureDate &&
      form.departureDate === form.arrivalDate &&
      form.departureTime &&
      form.arrivalTime &&
      form.arrivalTime < form.departureTime
    ) {
      setError("Op dezelfde dag kan de aankomsttijd niet vóór de vertrektijd liggen.");
      return;
    }
    if (!Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) {
      setError("Vul een geldig kostenbedrag van 0 of meer in.");
      return;
    }
    const from = form.from.trim();
    const to = form.to.trim();
    const resolveDestinationId = (name: string, currentId: string) => {
      const currentDestination = destinations.find((destination) => destination.id === currentId);
      if (currentDestination?.name === name) return currentId;
      const matches = destinations.filter((destination) => destination.name === name);
      return matches.length === 1 ? matches[0].id : "";
    };
    onSubmit({
      ...form,
      from,
      to,
      fromDestinationId: resolveDestinationId(from, form.fromDestinationId),
      toDestinationId: resolveDestinationId(to, form.toDestinationId),
      routeDescription: form.routeDescription.trim(),
      provider: form.provider.trim(),
      bookingReference: form.bookingReference.trim(),
      cost: Number(form.cost) || 0,
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="label">Van</span>
          <input
            className="input mt-1"
            value={form.from}
            onChange={(event) => {
              const from = event.target.value;
              const linked = destinations.find(
                (destination) => destination.id === form.fromDestinationId
              );
              setForm({
                ...form,
                from,
                fromDestinationId: linked?.name === from ? form.fromDestinationId : "",
              });
            }}
            placeholder="Vertrekpunt"
            autoFocus
          />
        </label>

        <label>
          <span className="label">Naar</span>
          <input
            className="input mt-1"
            value={form.to}
            onChange={(event) => {
              const to = event.target.value;
              const linked = destinations.find(
                (destination) => destination.id === form.toDestinationId
              );
              setForm({
                ...form,
                to,
                toDestinationId: linked?.name === to ? form.toDestinationId : "",
              });
            }}
            placeholder="Aankomstpunt"
          />
        </label>

        <label>
          <span className="label">Type vervoer</span>
          <select
            className="input mt-1"
            value={form.mode}
            onChange={(event) => setForm({ ...form, mode: event.target.value as TransportMode })}
          >
            {transportModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Status</span>
          <select
            className="input mt-1"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as TransportStatus })}
          >
            {transportStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Vertrekdatum</span>
          <input
            className="input mt-1"
            type="date"
            max={form.arrivalDate || undefined}
            value={form.departureDate}
            onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Aankomstdatum</span>
          <input
            className="input mt-1"
            type="date"
            min={form.departureDate || undefined}
            value={form.arrivalDate}
            onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Vertrektijd</span>
          <input
            className="input mt-1"
            type="time"
            value={form.departureTime}
            onChange={(event) => setForm({ ...form, departureTime: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Aankomsttijd</span>
          <input
            className="input mt-1"
            type="time"
            min={
              form.departureDate && form.departureDate === form.arrivalDate
                ? form.departureTime || undefined
                : undefined
            }
            value={form.arrivalTime}
            onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Vervoerder</span>
          <input
            className="input mt-1"
            value={form.provider}
            onChange={(event) => setForm({ ...form, provider: event.target.value })}
            placeholder="Bijv. NS International"
          />
        </label>

        <label>
          <span className="label">Boekingsnummer</span>
          <input
            className="input mt-1"
            value={form.bookingReference}
            onChange={(event) => setForm({ ...form, bookingReference: event.target.value })}
            placeholder="Optionele reserveringscode"
          />
        </label>

        <label>
          <span className="label">Kosten</span>
          <input
            className="input mt-1"
            min={0}
            step="0.01"
            type="number"
            value={form.cost}
            onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })}
          />
        </label>

        <fieldset className="rounded-xl border border-slate-200 bg-white p-3">
          <legend className="label px-1">Gekoppelde documenten</legend>
          {documents.length > 0 ? (
            <div className="mt-1 max-h-32 space-y-2 overflow-y-auto">
              {documents.map((document) => (
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700" key={document.id}>
                  <input
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-mint-700 focus:ring-mint-500"
                    type="checkbox"
                    checked={form.documentIds.includes(document.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        documentIds: event.target.checked
                          ? Array.from(new Set([...current.documentIds, document.id]))
                          : current.documentIds.filter((id) => id !== document.id),
                      }))
                    }
                  />
                  <span className="min-w-0 break-words">{document.fileName}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Nog geen documenten beschikbaar.</p>
          )}
        </fieldset>

        <label className="md:col-span-2">
          <span className="label">Globale route</span>
          <input
            className="input mt-1"
            value={form.routeDescription}
            onChange={(event) => setForm({ ...form, routeDescription: event.target.value })}
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Link naar boeking of planner</span>
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
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button className="btn-primary" type="submit">
          Vervoer opslaan
        </button>
      </div>
    </form>
  );
};
