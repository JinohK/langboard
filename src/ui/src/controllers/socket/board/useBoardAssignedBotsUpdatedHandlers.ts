import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel, Project } from "@/core/models";

export interface IBoardAssignedBotsUpdatedRawResponse {
    assigned_bots: BotModel.Interface[];
}

export interface IUseBoardAssignedBotsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardAssignedBotsUpdatedHandlers = ({ callback, projectUID }: IUseBoardAssignedBotsUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardAssignedBotsUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-assigned-bots-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_BOTS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const model = Project.Model.getModel(projectUID);
                if (model) {
                    model.bots = data.assigned_bots;
                    if (model.bot_roles) {
                        const botRoles = { ...model.bot_roles };
                        Object.keys(botRoles).forEach((botUID) => {
                            if (!model.bots.some((bot) => bot.uid === botUID)) {
                                delete botRoles[botUID];
                            }
                        });
                        for (let i = 0; i < data.assigned_bots.length; ++i) {
                            const assignedBot = data.assigned_bots[i];
                            if (!botRoles[assignedBot.uid]) {
                                botRoles[assignedBot.uid] = [Project.ERoleAction.Read];
                            }
                        }
                        model.bot_roles = botRoles;
                    }
                }

                return {};
            },
        },
    });
};

export default useBoardAssignedBotsUpdatedHandlers;
