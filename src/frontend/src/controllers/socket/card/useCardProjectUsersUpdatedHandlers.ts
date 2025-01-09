import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, User } from "@/core/models";

export interface ICardProjectUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
}

export interface IUseCardProjectUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    card: ProjectCard.TModel;
}

const useCardProjectUsersUpdatedHandlers = ({ callback, projectUID, card }: IUseCardProjectUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardProjectUsersUpdatedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: projectUID,
        eventKey: `board-card-project-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                card.project_members = User.Model.fromObjectArray(data.assigned_members);
                card.members = card.members.filter((member) => {
                    return data.assigned_members.some((projectMember) => projectMember.uid === member.uid);
                });

                return {};
            },
        },
    });
};

export default useCardProjectUsersUpdatedHandlers;
