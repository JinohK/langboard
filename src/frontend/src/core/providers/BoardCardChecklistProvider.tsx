import { createContext, useContext } from "react";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectChecklist } from "@/core/models";

export interface IBoardCardChecklistContext {
    checklist: ProjectChecklist.TModel;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    sharedErrorHandler: (error: unknown) => string;
}

interface IBoardCardChecklistProviderProps {
    checklist: ProjectChecklist.TModel;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    children: React.ReactNode;
}

const initialContext = {
    checklist: {} as ProjectChecklist.TModel,
    isValidating: false,
    setIsValidating: () => {},
    sharedErrorHandler: () => "",
};

const BoardCardChecklistContext = createContext<IBoardCardChecklistContext>(initialContext);

export const BoardCardChecklistProvider = ({
    checklist,
    isValidating,
    setIsValidating,
    children,
}: IBoardCardChecklistProviderProps): React.ReactNode => {
    const sharedErrorHandler = (error: unknown) => {
        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler({}, messageRef);

        handle(error);
        return messageRef.message;
    };

    return (
        <BoardCardChecklistContext.Provider
            value={{
                checklist,
                isValidating,
                setIsValidating,
                sharedErrorHandler,
            }}
        >
            {children}
        </BoardCardChecklistContext.Provider>
    );
};

export const useBoardCardChecklist = () => {
    const context = useContext(BoardCardChecklistContext);
    if (!context) {
        throw new Error("useBoardCardChecklist must be used within a BoardCardChecklistProvider");
    }
    return context;
};
