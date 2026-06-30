import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  FileWarning,
  GripVertical,
  MapPin,
  Plus,
  Route,
  Trash2,
} from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatMoney } from "../../data/emptyTrip";
import type { AppData, Destination, Transport } from "../../types";
import { DestinationForm } from "./DestinationForm";
import { TransportForm } from "./TransportForm";

interface DestinationListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

interface TransportDefaults {
  from?: string;
  to?: string;
}

export const DestinationList = ({ data, setData }: DestinationListProps) => {
  const [showDestinationForm, setShowDestinationForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | undefined>();
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | undefined>();
  const [transportDefaults, setTransportDefaults] = useState<TransportDefaults>({});

  const upsertDestination = (destination: Destination) => {
    setData((current) => {
      const exists = current.destinations.some((item) => item.id === destination.id);
      const previousName = current.destinations.find((item) => item.id === destination.id)?.name;
      return {
        ...current,
        destinations: exists
          ? current.destinations.map((item) => (item.id === destination.id ? destination : item))
          : [...current.destinations, destination],
        transports:
          previousName && previousName !== destination.name
            ? current.transports.map((transport) => ({
                ...transport,
                from: transport.from === previousName ? destination.name : transport.from,
                to: transport.to === previousName ? destination.name : transport.to,
              }))
            : current.transports,
      };
    });
    setShowDestinationForm(false);
    setEditingDestination(undefined);
  };

  const deleteDestination = (id: string) => {
    if (!window.confirm("Deze bestemming verwijderen?")) return;
    setData((current) => ({
      ...current,
      destinations: current.destinations.filter((destination) => destination.id !== id),
      expenses: current.expenses.map((expense) =>
        expense.destinationId === id ? { ...expense, destinationId: "" } : expense
      ),
      documents: current.documents.map((document) =>
        document.linkedDestinationId === id ? { ...document, linkedDestinationId: "" } : document
      ),
    }));
  };

  const moveDestination = (index: number, direction: -1 | 1) => {
    setData((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.destinations.length) return current;
      const destinations = [...current.destinations];
      [destinations[index], destinations[nextIndex]] = [destinations[nextIndex], destinations[index]];
      return { ...current, destinations };
    });
  };

  const upsertTransport = (transport: Transport) => {
    setData((current) => {
      const exists = current.transports.some((item) => item.id === transport.id);
      return {
        ...current,
        transports: exists
          ? current.transports.map((item) => (item.id === transport.id ? transport : item))
          : [...current.transports, transport],
      };
    });
    setShowTransportForm(false);
    setEditingTransport(undefined);
    setTransportDefaults({});
  };

  const deleteTransport = (id: string) => {
    if (!window.confirm("Dit vervoersitem verwijderen?")) return;
    setData((current) => ({
      ...current,
      transports: current.transports.filter((transport) => transport.id !== id),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        transportIds: day.transportIds.filter((transportId) => transportId !== id),
      })),
    }));
  };

  const startTransport = (defaults: TransportDefaults = {}) => {
    setEditingTransport(undefined);
    setTransportDefaults(defaults);
    setShowTransportForm(true);
  };

  const matchingTransportIds = new Set<string>();
  data.destinations.forEach((destination, index) => {
    const nextDestination = data.destinations[index + 1];
    if (!nextDestination) return;
    data.transports
      .filter((transport) => transport.from === destination.name && transport.to === nextDestination.name)
      .forEach((transport) => matchingTransportIds.add(transport.id));
  });

  const getBetweenTransports = (from: string, to: string) =>
    data.transports.filter((transport) => transport.from === from && transport.to === to);

  const renderTransport = (transport: Transport) => (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
      key={transport.id}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Route size={17} className="text-mint-700" />
          <p className="font-semibold text-slate-900">
            {transport.from} naar {transport.to}
          </p>
          <StatusBadge status={transport.status} />
          {transport.status === "geboekt" && transport.documentIds.length === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              <FileWarning size={13} />
              Boeking heeft nog geen document.
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {transport.mode}
          {transport.routeDescription ? ` · ${transport.routeDescription}` : ""}
          {transport.departureDate ? ` · ${formatDate(transport.departureDate)}` : ""}
          {transport.cost ? ` · ${formatMoney(transport.cost, data.trip?.currency)}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          className="icon-btn"
          type="button"
          title="Vervoer bewerken"
          onClick={() => {
            setEditingTransport(transport);
            setShowTransportForm(true);
          }}
        >
          <Edit2 size={16} />
        </button>
        <button
          className="icon-btn text-rose-600"
          type="button"
          title="Vervoer verwijderen"
          onClick={() => deleteTransport(transport.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const unmatchedTransports = data.transports.filter((transport) => !matchingTransportIds.has(transport.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Route-overzicht</h2>
          <p className="text-sm text-slate-500">Bestemmingen en vervoer blijven leeg totdat je ze toevoegt.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => startTransport()}>
            <Plus size={16} />
            Vervoer toevoegen
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingDestination(undefined);
              setShowDestinationForm(true);
            }}
          >
            <Plus size={16} />
            Bestemming toevoegen
          </button>
        </div>
      </div>

      {showDestinationForm ? (
        <DestinationForm
          initial={editingDestination}
          onCancel={() => {
            setShowDestinationForm(false);
            setEditingDestination(undefined);
          }}
          onSubmit={upsertDestination}
        />
      ) : null}

      {showTransportForm ? (
        <TransportForm
          defaultFrom={transportDefaults.from}
          defaultTo={transportDefaults.to}
          documents={data.documents}
          initial={editingTransport}
          onCancel={() => {
            setShowTransportForm(false);
            setEditingTransport(undefined);
            setTransportDefaults({});
          }}
          onSubmit={upsertTransport}
        />
      ) : null}

      {data.destinations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nog geen bestemmingen toegevoegd"
          description="Voeg je eerste bestemming toe om je route op te bouwen."
          actionLabel="Voeg je eerste bestemming toe"
          onAction={() => setShowDestinationForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {data.destinations.map((destination, index) => {
            const nextDestination = data.destinations[index + 1];
            const betweenTransports = nextDestination
              ? getBetweenTransports(destination.name, nextDestination.name)
              : [];
            const linkedAccommodationDoc = data.documents.some(
              (document) => document.linkedDestinationId === destination.id
            );

            return (
              <div key={destination.id}>
                <div className="panel">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <GripVertical size={17} className="text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-950">{destination.name}</h3>
                        <StatusBadge status={destination.type} />
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="label">Nachten</p>
                          <p className="mt-1 font-semibold text-slate-900">{destination.nights}</p>
                        </div>
                        <div>
                          <p className="label">Verblijfstatus</p>
                          <div className="mt-1">
                            <StatusBadge status={destination.accommodationStatus} />
                          </div>
                        </div>
                        <div>
                          <p className="label">Vervoerstatus</p>
                          <div className="mt-1">
                            <StatusBadge status={destination.transportStatus} />
                          </div>
                        </div>
                        <div>
                          <p className="label">Datums</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatDate(destination.arrivalDate)} - {formatDate(destination.departureDate)}
                          </p>
                        </div>
                      </div>
                      {destination.notes ? (
                        <p className="mt-3 text-sm text-slate-500">{destination.notes}</p>
                      ) : null}
                      {destination.accommodationStatus === "geboekt" && !linkedAccommodationDoc ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                          <FileWarning size={16} />
                          Verblijf heeft nog geen document.
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="icon-btn"
                        type="button"
                        title="Omhoog"
                        disabled={index === 0}
                        onClick={() => moveDestination(index, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Omlaag"
                        disabled={index === data.destinations.length - 1}
                        onClick={() => moveDestination(index, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Bestemming bewerken"
                        onClick={() => {
                          setEditingDestination(destination);
                          setShowDestinationForm(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn text-rose-600"
                        type="button"
                        title="Bestemming verwijderen"
                        onClick={() => deleteDestination(destination.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {nextDestination ? (
                  <div className="my-3 ml-6 border-l-2 border-dashed border-mint-200 pl-4">
                    {betweenTransports.length > 0 ? (
                      <div className="space-y-2">{betweenTransports.map(renderTransport)}</div>
                    ) : (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => startTransport({ from: destination.name, to: nextDestination.name })}
                      >
                        <Plus size={16} />
                        Vervoer tussen deze stops toevoegen
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {data.transports.length === 0 ? (
        <EmptyState
          icon={Route}
          title="Nog geen vervoer gepland"
          description="Voeg vervoer toe zodra je zelf een route of boeking wilt vastleggen."
          actionLabel="Vervoer toevoegen"
          onAction={() => startTransport()}
        />
      ) : unmatchedTransports.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-950">Overig vervoer</h3>
          {unmatchedTransports.map(renderTransport)}
        </section>
      ) : null}
    </div>
  );
};
