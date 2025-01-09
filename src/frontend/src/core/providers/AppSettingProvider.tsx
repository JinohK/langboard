import { AuthUser } from "@/core/models";
import { createContext, useContext, useState } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IAppSettingContext {
    currentUser: AuthUser.TModel;
    navigate: React.RefObject<NavigateFunction>;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

interface IAppSettingProps {
    currentUser: AuthUser.TModel;
    navigate: React.RefObject<NavigateFunction>;
    children: React.ReactNode;
}

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    navigate: { current: () => {} },
    isValidating: false,
    setIsValidating: () => {},
};

const AppSettingContext = createContext<IAppSettingContext>(initialContext);

export const AppSettingProvider = ({ currentUser, navigate, children }: IAppSettingProps): React.ReactNode => {
    const [isValidating, setIsValidating] = useState(false);

    return (
        <AppSettingContext.Provider
            value={{
                currentUser,
                navigate,
                isValidating,
                setIsValidating,
            }}
        >
            {children}
        </AppSettingContext.Provider>
    );
};

export const useAppSetting = () => {
    const context = useContext(AppSettingContext);
    if (!context) {
        throw new Error("useAppSetting must be used within an AppSettingProvider");
    }
    return context;
};
