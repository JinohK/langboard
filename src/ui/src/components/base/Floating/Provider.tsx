import { createContext, useContext, useState } from "react";

export interface IFloatingButtonContext {
    fullScreen: bool;
    isOpened: bool;
    setIsOpened: React.Dispatch<React.SetStateAction<bool>>;
}

interface IFloatingButtonProviderProps {
    fullScreen?: bool;
    children: React.ReactNode;
}

const initialContext = {
    fullScreen: false,
    isOpened: false,
    setIsOpened: () => {},
};

const FloatingButtonContext = createContext<IFloatingButtonContext>(initialContext);

export const FloatingButtonProvider = ({ fullScreen = false, children }: IFloatingButtonProviderProps): React.ReactNode => {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <FloatingButtonContext.Provider
            value={{
                fullScreen,
                isOpened,
                setIsOpened,
            }}
        >
            {children}
        </FloatingButtonContext.Provider>
    );
};

export const useFloatingButton = () => {
    const context = useContext(FloatingButtonContext);
    if (!context) {
        throw new Error("useFloatingButton must be used within a FloatingButtonProvider");
    }
    return context;
};
