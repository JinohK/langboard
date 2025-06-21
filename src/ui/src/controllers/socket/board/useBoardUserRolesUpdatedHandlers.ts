import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IBoardUserRolesUpdatedRawResponse {
    user_uid: string;
    roles: Project.TRoleActions[];
}

export interface IUseBoardUserRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardUserRolesUpdatedHandlers = ({ callback, projectUID }: IUseBoardUserRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardUserRolesUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-user-roles-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.USER_ROLES_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const model = Project.Model.getModel(projectUID);
                if (model && model.member_roles) {
                    const memberRoles = { ...model.member_roles };
                    memberRoles[data.user_uid] = data.roles;
                    model.member_roles = memberRoles;
                }

                return {};
            },
        },
    });
};

export default useBoardUserRolesUpdatedHandlers;
