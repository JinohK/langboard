import useBotSettingCreatedHandlers from "@/controllers/socket/settings/bots/useBotSettingCreatedHandlers";
import useAppSettingCreatedHandlers from "@/controllers/socket/settings/useAppSettingCreatedHandlers";
import useSelectedAppSettingsDeletedHandlers from "@/controllers/socket/settings/useSelectedAppSettingsDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser } from "@/core/models";
import { useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext, useState } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IAppSettingContext {
    currentUser: AuthUser.TModel;
    navigateRef: React.RefObject<NavigateFunction>;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

interface IAppSettingProps {
    currentUser: AuthUser.TModel;
    navigateRef: React.RefObject<NavigateFunction>;
    children: React.ReactNode;
}

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    navigateRef: { current: () => {} },
    isValidating: false,
    setIsValidating: () => {},
};

const AppSettingContext = createContext<IAppSettingContext>(initialContext);

export const AppSettingProvider = ({ currentUser, navigateRef, children }: IAppSettingProps): React.ReactNode => {
    const socket = useSocket();
    const [isValidating, setIsValidating] = useState(false);
    const appSettingCreatedHandlers = useAppSettingCreatedHandlers({});
    const selectedAppSettingsDeletedHandlers = useSelectedAppSettingsDeletedHandlers({});
    const botSettingCreatedHandlers = useBotSettingCreatedHandlers({});

    useSwitchSocketHandlers({
        socket,
        handlers: [appSettingCreatedHandlers, selectedAppSettingsDeletedHandlers, botSettingCreatedHandlers],
    });

    return (
        <AppSettingContext.Provider
            value={{
                currentUser,
                navigateRef,
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
