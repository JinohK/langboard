import useBotSettingCreatedHandlers from "@/controllers/socket/settings/bots/useBotSettingCreatedHandlers";
import useAppSettingCreatedHandlers from "@/controllers/socket/settings/useAppSettingCreatedHandlers";
import useSelectedAppSettingsDeletedHandlers from "@/controllers/socket/settings/useSelectedAppSettingsDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser } from "@/core/models";
import { useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext, useState } from "react";

export interface IAppSettingContext {
    currentUser: AuthUser.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

interface IAppSettingProviderProps {
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    isValidating: false,
    setIsValidating: () => {},
};

const AppSettingContext = createContext<IAppSettingContext>(initialContext);

export const AppSettingProvider = ({ currentUser, children }: IAppSettingProviderProps): React.ReactNode => {
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
