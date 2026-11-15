import { Component, type ReactNode } from "react";

/** Keep navigation available when a lazy panel fails, including an outdated open tab. */
export class PanelBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="ps-empty" role="alert">
        <h1>Nie udało się otworzyć panelu</h1>
        <p>
          Odśwież stronę, aby pobrać aktualną wersję. Jeśli problem się
          powtórzy, sprawdź połączenie i spróbuj ponownie.
        </p>
        <button className="ps-button" onClick={() => location.reload()}>
          Odśwież stronę
        </button>
        <button
          className="ps-text-button"
          onClick={() => {
            location.hash = "#/logowanie";
            this.setState({ failed: false });
          }}
        >
          Wróć do logowania
        </button>
      </section>
    );
  }
}
