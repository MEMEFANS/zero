import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../../../App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">出错了</div>
            <div className="text-red-400/60 text-sm">{this.state.error?.message}</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 bg-red-500/20 text-red-400 py-2 px-4 rounded-lg hover:bg-red-500/30 transition-all"
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
