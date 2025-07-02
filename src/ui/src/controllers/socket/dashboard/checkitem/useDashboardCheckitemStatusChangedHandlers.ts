import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, User } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCheckitemStatusChangedRawResponse {
    uid: string;
    user?: User.Interface;
    status: ProjectCheckitem.ECheckitemStatus;
    accumulated_seconds: number;
    is_checked: bool;
    timer_started_at?: Date;
}

export interface IUseDashboardCheckitemStatusChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCheckitemStatusChangedHandlers = ({ callback, projectUID }: IUseDashboardCheckitemStatusChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCheckitemStatusChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-checkitem-status-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CHECKITEM.STATUS_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(data.uid);
                if (checkitem) {
                    Object.entries(data).forEach(([key, value]) => {
                        checkitem[key] = value as never;
                    });
                }
                return {};
            },
        },
    });
};

export default useDashboardCheckitemStatusChangedHandlers;
