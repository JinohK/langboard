import { AuthUser } from "@/core/models";
import { IAuthContext } from "@/core/providers/AuthProvider";

export interface IEmailComponentProps extends Pick<IAuthContext, "updatedUser"> {
    user: AuthUser.TModel | null;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

export interface IGroupComponentProps extends Pick<IAuthContext, "updatedUser"> {
    user: AuthUser.TModel;
}
