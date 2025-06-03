import { createContext, useContext } from "react";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectCheckitem } from "@/core/models";

export interface IBoardCardCheckitemContext {
    checkitem: ProjectCheckitem.TModel;
    canEditCheckitem: bool;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    sharedErrorHandler: (error: unknown) => string;
}

interface IBoardCardCheckitemProviderProps {
    checkitem: ProjectCheckitem.TModel;
    canEditCheckitem: bool;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    children: React.ReactNode;
}

const initialContext = {
    checkitem: {} as ProjectCheckitem.TModel,
    canEditCheckitem: false,
    isValidating: false,
    setIsValidating: () => {},
    sharedErrorHandler: () => "",
};

const BoardCardCheckitemContext = createContext<IBoardCardCheckitemContext>(initialContext);

export const BoardCardCheckitemProvider = ({
    checkitem,
    canEditCheckitem,
    isValidating,
    setIsValidating,
    children,
}: IBoardCardCheckitemProviderProps): React.ReactNode => {
    const sharedErrorHandler = (error: unknown) => {
        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler({}, messageRef);

        handle(error);
        return messageRef.message;
    };

    return (
        <BoardCardCheckitemContext.Provider
            value={{
                checkitem,
                canEditCheckitem,
                isValidating,
                setIsValidating,
                sharedErrorHandler,
            }}
        >
            {children}
        </BoardCardCheckitemContext.Provider>
    );
};

export const useBoardCardCheckitem = () => {
    const context = useContext(BoardCardCheckitemContext);
    if (!context) {
        throw new Error("useBoardCardCheckitem must be used within a BoardCardCheckitemProvider");
    }
    return context;
};
