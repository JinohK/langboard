import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

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
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CHECKITEM.CHECKED_CHANGED,
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
