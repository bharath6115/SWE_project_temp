import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "", stack: "", componentStack: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected error",
      stack: error?.stack || "",
    };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error);
    this.setState({ componentStack: info?.componentStack || "" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-3xl p-6">
          <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm">{this.state.message}</p>
            <p className="mt-2 text-sm">
              Please refresh the page. If this continues, share this message in chat.
            </p>
            {this.state.stack && (
              <pre className="mt-3 overflow-auto rounded bg-white p-2 text-xs text-red-800">
                {this.state.stack}
              </pre>
            )}
            {this.state.componentStack && (
              <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs text-red-800">
                {this.state.componentStack}
              </pre>
            )}
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
