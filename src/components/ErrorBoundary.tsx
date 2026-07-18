import { Component, type ErrorInfo, type ReactNode } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Reisplanner kon niet renderen", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-soft">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <CircleAlert size={23} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-950">De planner kon niet worden getoond</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Je lokale gegevens zijn niet automatisch verwijderd. Herlaad de app; als het probleem blijft bestaan,
            kun je daarna een eerder gedownloade back-up importeren.
          </p>
          <button className="btn-primary mt-5" type="button" onClick={() => window.location.reload()}>
            <RotateCcw size={16} /> App herladen
          </button>
        </section>
      </main>
    );
  }
}
