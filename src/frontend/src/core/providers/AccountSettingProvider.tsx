import { AuthUser } from "@/core/models";
import { useAuth } from "@/core/providers/AuthProvider";
import { createContext, useContext, useState } from "react";

export interface IAccountSettingContext {
    currentUser: AuthUser.TModel;
    updatedUser: () => void;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

interface IAccountSettingProps {
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    updatedUser: () => {},
    isValidating: false,
    setIsValidating: () => {},
};

const AccountSettingContext = createContext<IAccountSettingContext>(initialContext);

export const AccountSettingProvider = ({ currentUser, children }: IAccountSettingProps): React.ReactNode => {
    const { updatedUser } = useAuth();
    const [isValidating, setIsValidating] = useState(false);

    return (
        <AccountSettingContext.Provider
            value={{
                currentUser,
                updatedUser,
                isValidating,
                setIsValidating,
            }}
        >
            {children}
        </AccountSettingContext.Provider>
    );
};

export const useAccountSetting = () => {
    const context = useContext(AccountSettingContext);
    if (!context) {
        throw new Error("useAccountSetting must be used within an AccountSettingProvider");
    }
    return context;
};
