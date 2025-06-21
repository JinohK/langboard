import { createContext, useContext } from "react";

export interface IMoreMenuContext {
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    isOpened: bool;
    setIsOpened: (value: bool) => void;
}

interface IMoreMenuProviderProps {
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    isOpened: bool;
    setIsOpened: (value: bool) => void;
    children: React.ReactNode;
}

const initialContext = {
    isValidating: false,
    setIsValidating: () => {},
    isOpened: false,
    setIsOpened: () => {},
};

const MoreMenuContext = createContext<IMoreMenuContext>(initialContext);

export const MoreMenuProvider = ({ isValidating, setIsValidating, isOpened, setIsOpened, children }: IMoreMenuProviderProps): React.ReactNode => {
    return (
        <MoreMenuContext.Provider
            value={{
                isValidating,
                setIsValidating,
                isOpened,
                setIsOpened,
            }}
        >
            {children}
        </MoreMenuContext.Provider>
    );
};

export const useMoreMenu = () => {
    const context = useContext(MoreMenuContext);
    if (!context) {
        throw new Error("useMoreMenu must be used within a MoreMenuProvider");
    }
    return context;
};
