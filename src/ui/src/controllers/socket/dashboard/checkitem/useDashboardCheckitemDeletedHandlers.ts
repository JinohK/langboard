import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCheckitemDeletedRawResponse {
    uid: string;
}

export interface IUseDashboardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCheckitemDeletedHandlers = ({ callback, projectUID }: IUseDashboardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCheckitemDeletedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-checkitem-deleted-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.CHECKITEM.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useDashboardCheckitemDeletedHandlers;
