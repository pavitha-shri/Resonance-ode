import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'An unknown error occurred' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06090e] text-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl mb-4 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            ⚡
          </div>
          <h1 className="text-xl font-bold text-white mb-2 font-mono">
            Resonance Arena Ready
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
            The session encountered a display refresh. Tap below to reload your student controller cleanly.
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = window.location.origin + '/?student=true&__storage_access_granted=1&reload=' + Date.now();
              }
            }}
            className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-sm tracking-wider uppercase shadow-lg transition-all"
          >
            Launch Student Controller →
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
