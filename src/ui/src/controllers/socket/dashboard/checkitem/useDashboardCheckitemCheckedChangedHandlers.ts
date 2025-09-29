import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCheckitemCheckedChangedRawResponse {
    uid: string;
    is_checked: bool;
}

export interface IUseDashboardCheckitemCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCheckitemCheckedChangedHandlers = ({ callback, projectUID }: IUseDashboardCheckitemCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCheckitemCheckedChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-checkitem-checked-changed-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.CHECKITEM.CHECKED_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(data.uid);
                if (checkitem) {
                    checkitem.is_checked = data.is_checked;
                }
                return {};
            },
        },
    });
};

export default useDashboardCheckitemCheckedChangedHandlers;
