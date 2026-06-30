import { useState } from "react";
import { createId } from "../../data/emptyTrip";
import {
  transportModes,
  transportStatuses,
  type Transport,
  type TransportMode,
  type TransportStatus,
  type TravelDocument,
} from "../../types";

interface TransportFormProps {
  documents: TravelDocument[];
  initial?: Transport;
  defaultFrom?: string;
  defaultTo?: string;
  onSubmit: (transport: Transport) => void;
  onCancel: () => void;
}

const createEmptyTransport = (defaultFrom = "", defaultTo = ""): Transport => ({
  id: createId("transport"),
  from: defaultFrom,
  to: defaultTo,
  mode: "trein",
  routeDescription: "",
  departureDate: "",
  arrivalDate: "",
  status: "nog zoeken",
  cost: 0,
  bookingLink: "",
  documentIds: [],
  notes: "",
});

const selectedOptions = (select: HTMLSelectElement) =>
  Array.from(select.selectedOptions).map((option) => option.value);

export const TransportForm = ({
  documents,
  initial,
  defaultFrom,
  defaultTo,
  onSubmit,
  onCancel,
}: TransportFormProps) => {
  const [form, setForm] = useState<Transport>(initial ?? createEmptyTransport(defaultFrom, defaultTo));
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.from.trim() || !form.to.trim()) {
      setError("Vul een vertrekpunt en aankomstpunt in.");
      return;
    }
    onSubmit({
      ...form,
      from: form.from.trim(),
      to: form.to.trim(),
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
            onChange={(event) => setForm({ ...form, from: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Naar</span>
          <input
            className="input mt-1"
            value={form.to}
            onChange={(event) => setForm({ ...form, to: event.target.value })}
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
            value={form.departureDate}
            onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Aankomstdatum</span>
          <input
            className="input mt-1"
            type="date"
            value={form.arrivalDate}
            onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
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

        <label>
          <span className="label">Gekoppelde documenten</span>
          <select
            multiple
            className="input mt-1 min-h-24"
            value={form.documentIds}
            onChange={(event) => setForm({ ...form, documentIds: selectedOptions(event.currentTarget) })}
          >
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.fileName}
              </option>
            ))}
          </select>
        </label>

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

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

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
