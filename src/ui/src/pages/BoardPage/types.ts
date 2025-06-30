import { AuthUser } from "@/core/models";

export interface IBoardRelatedPageProps {
    projectUID: string;
    currentUser: AuthUser.TModel;
}
