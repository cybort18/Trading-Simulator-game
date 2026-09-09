import { Component, ErrorInfo, ReactNode } from 'react';
import { PixelIcon } from '@/components/common/PixelIcon';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RetroErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`RetroErrorBoundary caught an error in [${this.props.name}]:`, error, errorInfo);
  }

  handleRestart = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-[420px] max-w-[95vw] win-outset bg-win-base p-0.5 shadow-2xl font-ui">
            {/* Titlebar */}
            <div className="bg-gradient-to-r from-[#000080] to-[#1084D0] px-2 py-1 flex items-center justify-between select-none">
              <div className="flex items-center space-x-1.5 text-white font-bold text-[11px]">
                <PixelIcon name="warning" size={14} className="text-crt-amber" />
                <span>Application Error - {this.props.name}</span>
              </div>
              <button
                onClick={this.handleRestart}
                className="w-4 h-3.5 win-outset bg-win-base text-black text-[9px] font-bold flex items-center justify-center leading-none active:win-inset"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-3 flex flex-col gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 win-inset bg-black flex items-center justify-center text-red-500 font-bold text-lg flex-shrink-0">
                  ⚠️
                </div>
                <div className="space-y-1 text-black">
                  <h4 className="font-bold text-[12px]">
                    An unexpected fault occurred in {this.props.name}.
                  </h4>
                  <p className="text-[11px] text-bevel-dark leading-tight">
                    The subsystem encountered an exception. Click Restart to re-initialize this module without crashing your desktop session.
                  </p>
                </div>
              </div>

              {/* Diagnostic Inset */}
              {this.state.error && (
                <div className="win-inset bg-[#121212] text-red-400 p-2 font-mono text-[9px] max-h-24 overflow-auto break-all border border-[#333]">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-1 border-t border-win-highlight">
                <button
                  onClick={this.handleRestart}
                  className="win-outset bg-win-base px-4 py-1 font-bold text-[11px] text-black active:win-inset hover:brightness-105"
                >
                  Restart {this.props.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
