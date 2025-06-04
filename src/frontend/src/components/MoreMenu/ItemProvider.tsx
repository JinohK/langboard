import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { createContext, useContext } from "react";

export interface IMoreMenuItemContext {
    isOpened: bool;
    setIsOpened: (value: bool) => void;
    save: () => void;
}

interface IMoreMenuItemProviderProps {
    isOpened: bool;
    setIsOpened: (value: bool) => void;
    onOpenChange?: (opened: bool) => void;
    onSave?: (endCallback: (shouldClose: bool) => void) => void;
    children: React.ReactNode;
}

const initialContext = {
    isOpened: false,
    setIsOpened: () => {},
    save: () => {},
};

const MoreMenuItemContext = createContext<IMoreMenuItemContext>(initialContext);

export const MoreMenuItemProvider = ({ isOpened, setIsOpened, onOpenChange, onSave, children }: IMoreMenuItemProviderProps): React.ReactNode => {
    const { isValidating, setIsValidating, setIsOpened: setIsMoreMenuOpened } = useMoreMenu();

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        onOpenChange?.(opened);

        setIsOpened(opened);
    };

    const save = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        onSave?.((shouldClose) => {
            setIsValidating(false);
            if (shouldClose) {
                setIsMoreMenuOpened(false);
                changeOpenState(false);
            }
        });
    };

    return (
        <MoreMenuItemContext.Provider
            value={{
                isOpened,
                setIsOpened: changeOpenState,
                save,
            }}
        >
            {children}
        </MoreMenuItemContext.Provider>
    );
};

export const useMoreMenuItem = () => {
    const context = useContext(MoreMenuItemContext);
    if (!context) {
        throw new Error("useMoreMenuItem must be used within a MoreMenuItemProvider");
    }
    return context;
};
