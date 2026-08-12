import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "32px",
            backgroundColor: "#191724",
            color: "#eb6f92",
            height: "100vh",
            boxSizing: "border-box",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", color: "#eb6f92" }}>
            Vault Application Error
          </h2>
          <p style={{ color: "#e0def4", marginBottom: "16px" }}>
            An unexpected error occurred during rendering:
          </p>
          <pre
            style={{
              padding: "16px",
              backgroundColor: "#1f1d2e",
              borderRadius: "4px",
              whiteSpace: "pre-wrap",
              overflow: "auto",
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#eb6f92",
              color: "#191724",
              border: "none",
              borderRadius: "4px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
