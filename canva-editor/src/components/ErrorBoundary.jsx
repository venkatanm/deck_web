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
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-2">Your work has been auto-saved. Refresh to continue.</p>
            <pre className="text-xs text-red-400 bg-red-50 rounded-lg p-3 text-left overflow-auto max-h-32 mb-4">{this.state.error?.message}</pre>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => window.location.reload()} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700">Reload App</button>
            <button type="button" onClick={() => this.setState({ hasError: false })} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
