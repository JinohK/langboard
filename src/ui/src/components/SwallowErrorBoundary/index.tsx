import { Toast } from "@/components/base";
import React from "react";

interface TProps {
    children?: React.ReactNode;
}

interface TState {
    error: Error | null;
}

class SwallowErrorBoundary extends React.Component<TProps, TState> {
    constructor(props: TProps) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): TState {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        Toast.Add.error("An error occured. Please report this issue to the developers that how you got this error.");
        console.error(error, errorInfo);
    }

    render() {
        return this.props.children;
    }
}

export default SwallowErrorBoundary;
