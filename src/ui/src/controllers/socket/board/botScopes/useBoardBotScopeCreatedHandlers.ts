import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotScopeCreatedRawResponse {
    scope_table: TBotRelatedTargetTable;
    bot_scope: ProjectColumnBotScope.Interface | ProjectCardBotScope.Interface;
}

export interface IUseBoardBotScopeCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotScopeCreatedHandlers = ({ callback, projectUID }: IUseBoardBotScopeCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotScopeCreatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-scope-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.BOT.SCOPE.CREATED,
            callback,
            responseConverter: (data) => {
                if (data.scope_table === "project_column") {
                    ProjectColumnBotScope.Model.fromOne(data.bot_scope, true);
                } else if (data.scope_table === "card") {
                    ProjectCardBotScope.Model.fromOne(data.bot_scope, true);
                }
                return {};
            },
        },
    });
};

export default useBoardBotScopeCreatedHandlers;
