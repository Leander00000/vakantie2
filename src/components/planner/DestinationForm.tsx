import { useState } from "react";
import { calculateNights } from "../../data/emptyTrip";
import {
  destinationTypes,
  stayStatuses,
  type Destination,
  type DestinationType,
  type StayStatus,
} from "../../types";
import { createId } from "../../data/emptyTrip";

interface DestinationFormProps {
  initial?: Destination;
  onSubmit: (destination: Destination) => void;
  onCancel: () => void;
}

const createEmptyDestination = (): Destination => ({
  id: createId("dest"),
  name: "",
  type: "verblijfplaats",
  arrivalDate: "",
  departureDate: "",
  nights: 0,
  accommodationStatus: "nog zoeken",
  transportStatus: "nog zoeken",
  accommodationLink: "",
  transportLink: "",
  notes: "",
});

export const DestinationForm = ({ initial, onSubmit, onCancel }: DestinationFormProps) => {
  const [form, setForm] = useState<Destination>(initial ?? createEmptyDestination());
  const [error, setError] = useState("");
  const nights = calculateNights(form.arrivalDate, form.departureDate);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Vul een bestemming in.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      nights,
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="label">Naam bestemming</span>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Zelf invullen"
          />
        </label>

        <label>
          <span className="label">Type</span>
          <select
            className="input mt-1"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as DestinationType })}
          >
            {destinationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="label">Nachten</span>
          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {nights}
          </div>
        </div>

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
          <span className="label">Vertrekdatum</span>
          <input
            className="input mt-1"
            type="date"
            value={form.departureDate}
            onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Verblijfstatus</span>
          <select
            className="input mt-1"
            value={form.accommodationStatus}
            onChange={(event) =>
              setForm({ ...form, accommodationStatus: event.target.value as StayStatus })
            }
          >
            {stayStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Vervoerstatus</span>
          <select
            className="input mt-1"
            value={form.transportStatus}
            onChange={(event) => setForm({ ...form, transportStatus: event.target.value as StayStatus })}
          >
            {stayStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="label">Link naar accommodatie</span>
          <input
            className="input mt-1"
            value={form.accommodationLink}
            onChange={(event) => setForm({ ...form, accommodationLink: event.target.value })}
            placeholder="https://"
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Link naar vervoer</span>
          <input
            className="input mt-1"
            value={form.transportLink}
            onChange={(event) => setForm({ ...form, transportLink: event.target.value })}
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
          Bestemming opslaan
        </button>
      </div>
    </form>
  );
};
