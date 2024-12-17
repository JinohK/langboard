import { IAuthUser } from "@/core/providers/AuthProvider";
import { NavigateFunction } from "react-router-dom";

export interface IBoardRelatedPageProps {
    navigate: NavigateFunction;
    projectUID: string;
    currentUser: IAuthUser;
}
