import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface IDashboardCardTitleChangedRawResponse {
    uid: string;
    title: string;
}

export interface IUseDashboardCardTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCardTitleChangedHandlers = ({ callback, projectUID }: IUseDashboardCardTitleChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCardTitleChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-card-title-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.TITLE_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(data.uid);
                if (card) {
                    card.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useDashboardCardTitleChangedHandlers;
