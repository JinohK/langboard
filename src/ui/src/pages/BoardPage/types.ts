import { AuthUser } from "@/core/models";
import { NavigateFunction } from "react-router-dom";

export interface IBoardRelatedPageProps {
    navigate: NavigateFunction;
    projectUID: string;
    currentUser: AuthUser.TModel;
}
