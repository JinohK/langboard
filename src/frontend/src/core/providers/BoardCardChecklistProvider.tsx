import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
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
    const [t] = useTranslation();

    const sharedErrorHandler = (error: unknown) => {
        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler(
            {
                [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("card.errors.Checklist not found."),
            },
            messageRef
        );

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
