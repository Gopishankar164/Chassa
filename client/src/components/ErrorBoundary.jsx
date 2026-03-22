import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you could send this to an error tracking service
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "80vh", padding: "40px 20px", textAlign: "center"
        }}>
          <p style={{ fontSize: "5rem", lineHeight: 1, marginBottom: 16 }}>⚠️</p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 10 }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", marginBottom: 28, maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              background: "var(--primary, #7c3aed)", color: "#fff", border: "none",
              padding: "12px 28px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.95rem"
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
