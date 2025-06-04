import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log the error to an error reporting service here
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1 style={{textAlign: 'center', marginTop: '2rem'}}>مشکلی در بارگذاری این بخش رخ داد.</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 