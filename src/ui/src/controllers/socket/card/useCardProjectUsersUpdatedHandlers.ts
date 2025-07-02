import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, User } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardProjectUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
}

export interface IUseCardProjectUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    card: ProjectCard.TModel;
}

const useCardProjectUsersUpdatedHandlers = ({ callback, projectUID, card }: IUseCardProjectUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardProjectUsersUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-project-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                card.project_members = User.Model.fromArray(data.assigned_members);
                card.member_uids = card.member_uids.filter((member_uid) => {
                    return data.assigned_members.some((projectMember) => projectMember.uid === member_uid);
                });

                return {};
            },
        },
    });
};

export default useCardProjectUsersUpdatedHandlers;
