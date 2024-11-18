import { IBoardCardWithDetails } from "@/controllers/board/useGetCardDetails";
import { Project } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";

export interface IBaseCardRelatedComponentProps {
    projectUID: string;
    card: IBoardCardWithDetails;
    currentUser: IAuthUser;
    currentUserRoleActions: Project.TRoleActions[];
    socket: IConnectedSocket;
}
