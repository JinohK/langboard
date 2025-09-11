/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from "react";

export interface IBotValueDefaultInputContext {
    selectedProvider: string;
    valuesRef: React.RefObject<Record<string, any>>;
    setValue: (name: string) => (value: any) => void;
    setInputRef: (name: string) => (element: HTMLElement | null) => void;
    required?: bool;
    isValidating: bool;
}

interface IBotValueDefaultInputProviderProps {
    selectedProvider: string;
    valuesRef: React.RefObject<Record<string, any>>;
    setValue: (name: string) => (value: any) => void;
    setInputRef: (name: string) => (element: HTMLElement | null) => void;
    required?: bool;
    isValidating: bool;
    children: React.ReactNode;
}

const initialContext = {
    selectedProvider: "",
    valuesRef: { current: {} },
    setValue: () => () => {},
    setInputRef: () => () => {},
    required: false,
    isValidating: false,
};

const BotValueDefaultInputContext = createContext<IBotValueDefaultInputContext>(initialContext);

export const BotValueDefaultInputProvider = ({ children, ...props }: IBotValueDefaultInputProviderProps): React.ReactNode => {
    return <BotValueDefaultInputContext.Provider value={props}>{children}</BotValueDefaultInputContext.Provider>;
};

export const useBotValueDefaultInput = () => {
    const context = useContext(BotValueDefaultInputContext);
    if (!context) {
        throw new Error("useBotValueDefaultInput must be used within an BotValueDefaultInputProvider");
    }
    return context;
};
