import { IAuthContext, IAuthUser } from "@/core/providers/AuthProvider";

export interface IEmailComponentProps extends Pick<IAuthContext, "updatedUser"> {
    user: IAuthUser | null;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}
