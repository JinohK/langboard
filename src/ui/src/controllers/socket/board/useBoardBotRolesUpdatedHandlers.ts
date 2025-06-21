import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IBoardBotRolesUpdatedRawResponse {
    bot_uid: string;
    roles: Project.TRoleActions[];
}

export interface IUseBoardBotRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotRolesUpdatedHandlers = ({ callback, projectUID }: IUseBoardBotRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotRolesUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-bot-roles-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.BOT_ROLES_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const model = Project.Model.getModel(projectUID);
                if (model && model.bot_roles) {
                    const memberRoles = { ...model.bot_roles };
                    memberRoles[data.bot_uid] = data.roles;
                    model.bot_roles = memberRoles;
                }

                return {};
            },
        },
    });
};

export default useBoardBotRolesUpdatedHandlers;
