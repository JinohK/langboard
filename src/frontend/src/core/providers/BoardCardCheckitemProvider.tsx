import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ProjectCheckitem } from "@/core/models";

export interface IBoardCardCheckitemContext {
    checkitem: ProjectCheckitem.IBaseBoard;
    isParent?: bool;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    sharedErrorHandler: (error: unknown) => string;
    deleted: (uid: string) => void;
    update: () => void;
}

interface IBoardCardCheckitemProviderProps {
    checkitem: ProjectCheckitem.IBaseBoard;
    isParent?: bool;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    deleted: (uid: string) => void;
    update: () => void;
    children: React.ReactNode;
}

const initialContext = {
    checkitem: {} as ProjectCheckitem.IBaseBoard,
    isParent: false,
    isValidating: false,
    setIsValidating: () => {},
    sharedErrorHandler: () => "",
    deleted: () => {},
    update: () => {},
};

const BoardCardCheckitemContext = createContext<IBoardCardCheckitemContext>(initialContext);

export const BoardCardCheckitemProvider = ({
    checkitem,
    isParent,
    isValidating,
    setIsValidating,
    deleted,
    update,
    children,
}: IBoardCardCheckitemProviderProps): React.ReactNode => {
    const [t] = useTranslation();

    const sharedErrorHandler = (error: unknown) => {
        let message = "";
        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                message = t("errors.Forbidden");
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                message = t("card.errors.Checkitem not found.");
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
        <BoardCardCheckitemContext.Provider
            value={{
                checkitem,
                isParent,
                isValidating,
                setIsValidating,
                sharedErrorHandler,
                update,
                deleted,
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
