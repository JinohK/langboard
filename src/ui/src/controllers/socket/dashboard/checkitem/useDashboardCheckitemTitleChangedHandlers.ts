import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCheckitemTitleChangedRawResponse {
    uid: string;
    title: string;
}

export interface IUseDashboardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCheckitemTitleChangedHandlers = ({ callback, projectUID }: IUseDashboardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCheckitemTitleChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-checkitem-status-changed-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.CHECKITEM.TITLE_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(data.uid);
                if (checkitem) {
                    checkitem.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useDashboardCheckitemTitleChangedHandlers;
