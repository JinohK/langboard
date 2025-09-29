import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardChecklistCheckedChangedRawResponse {
    uid: string;
    is_checked: bool;
}

export interface IUseCardChecklistCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardChecklistCheckedChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardChecklistCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistCheckedChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checklist-checked-changed-${cardUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CARD.CHECKLIST.CHECKED_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const model = ProjectChecklist.Model.getModel(data.uid);
                if (model) {
                    model.is_checked = data.is_checked;
                }
                return {};
            },
        },
    });
};

export default useCardChecklistCheckedChangedHandlers;
