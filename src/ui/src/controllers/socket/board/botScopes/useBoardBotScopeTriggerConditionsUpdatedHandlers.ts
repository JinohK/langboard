import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { ESocketTopic } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";

export interface IBoardBoardBotScopeConditionsUpdatedRawResponse {
    scope_table: TBotRelatedTargetTable;
    uid: string;
    conditions: string[];
}

export interface IUseBoardBoardBotScopeConditionsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBoardBotScopeConditionsUpdatedHandlers = ({ callback, projectUID }: IUseBoardBoardBotScopeConditionsUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBoardBotScopeConditionsUpdatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-scope-trigger-conditions-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.BOT.SCOPE.TRIGGER_CONDITION_TOGGLED,
            callback,
            responseConverter: (data) => {
                let model;
                if (data.scope_table === "project_column") {
                    model = ProjectColumnBotScope.Model.getModel(data.uid);
                } else if (data.scope_table === "card") {
                    model = ProjectCardBotScope.Model.getModel(data.uid);
                }

                if (model) {
                    model.conditions = data.conditions.map((condition) => {
                        return Utils.String.convertSafeEnum(EBotTriggerCondition, condition);
                    });
                }

                return {};
            },
        },
    });
};

export default useBoardBoardBotScopeConditionsUpdatedHandlers;
