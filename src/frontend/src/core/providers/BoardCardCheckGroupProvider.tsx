import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ProjectCheckGroup } from "@/core/models";

export interface IBoardCardCheckGroupContext {
    checkGroup: ProjectCheckGroup.TModel;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    sharedErrorHandler: (error: unknown) => string;
}

interface IBoardCardCheckGroupProviderProps {
    checkGroup: ProjectCheckGroup.TModel;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    children: React.ReactNode;
}

const initialContext = {
    checkGroup: {} as ProjectCheckGroup.TModel,
    isValidating: false,
    setIsValidating: () => {},
    sharedErrorHandler: () => "",
};

const BoardCardCheckGroupContext = createContext<IBoardCardCheckGroupContext>(initialContext);

export const BoardCardCheckGroupProvider = ({
    checkGroup,
    isValidating,
    setIsValidating,
    children,
}: IBoardCardCheckGroupProviderProps): React.ReactNode => {
    const [t] = useTranslation();

    const sharedErrorHandler = (error: unknown) => {
        let message = "";
        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                message = t("errors.Forbidden");
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                message = t("card.errors.Check group not found.");
            },
            nonApiError: () => {
                message = t("errors.Unknown error");
            },
            wildcardError: () => {
                message = t("errors.Internal server error");
            },
        });

        handle(error);
        return message;
    };

    return (
        <BoardCardCheckGroupContext.Provider
            value={{
                checkGroup,
                isValidating,
                setIsValidating,
                sharedErrorHandler,
            }}
        >
            {children}
        </BoardCardCheckGroupContext.Provider>
    );
};

export const useBoardCardCheckGroup = () => {
    const context = useContext(BoardCardCheckGroupContext);
    if (!context) {
        throw new Error("useBoardCardCheckGroup must be used within a BoardCardCheckGroupProvider");
    }
    return context;
};
