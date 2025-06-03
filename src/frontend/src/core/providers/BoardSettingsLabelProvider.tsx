import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectLabel } from "@/core/models";
import { createContext, useContext } from "react";

export interface IBoardSettingsLabelContext {
    label: ProjectLabel.TModel;
    isValidating: bool;
    setIsValidating: (isValidating: bool) => void;
    sharedErrorHandler: (error: unknown) => string;
}

interface IBoardSettingsLabelProps {
    label: ProjectLabel.TModel;
    isValidating: bool;
    setIsValidating: (isValidating: bool) => void;
    children: React.ReactNode;
}

const initialContext = {
    label: {} as ProjectLabel.TModel,
    isValidating: false,
    setIsValidating: () => {},
    sharedErrorHandler: () => "",
};

const BoardSettingsLabelContext = createContext<IBoardSettingsLabelContext>(initialContext);

export const BoardSettingsLabelProvider = ({ label, isValidating, setIsValidating, children }: IBoardSettingsLabelProps): React.ReactNode => {
    const sharedErrorHandler = (error: unknown) => {
        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler({}, messageRef);

        handle(error);
        return messageRef.message;
    };

    return (
        <BoardSettingsLabelContext.Provider
            value={{
                label,
                isValidating,
                setIsValidating,
                sharedErrorHandler,
            }}
        >
            {children}
        </BoardSettingsLabelContext.Provider>
    );
};

export const useBoardSettingsLabel = () => {
    const context = useContext(BoardSettingsLabelContext);
    if (!context) {
        throw new Error("useBoardSettingsLabel must be used within a BoardSettingsLabelProvider");
    }
    return context;
};
