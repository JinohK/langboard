import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";

export interface IBoardColumnDeletedRawResponse {
    uid: string;
    archive_column_uid: string;
    archived_at: string;
    count_all_cards_in_column: number;
}

export interface IUseBoardColumnDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    project: Project.TModel;
}

const useBoardColumnDeletedHandlers = ({ callback, project }: IUseBoardColumnDeletedHandlersProps) => {
    return useSocketHandler<{}, IBoardColumnDeletedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: project.uid,
        eventKey: `board-column-deleted-${project.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.DELETED,
            params: { uid: project.uid },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                ProjectColumn.Model.deleteModel(data.uid);

                if (column) {
                    const restColumns = ProjectColumn.Model.getModels((model) => model.project_uid === project.uid);
                    for (let i = 0; i < restColumns.length; ++i) {
                        const restColumn = restColumns[i];
                        if (restColumn.order > column.order) {
                            restColumn.order -= 1;
                        }
                    }
                }

                const cards = ProjectCard.Model.getModels((model) => model.column_uid === data.uid || model.column_uid === data.archive_column_uid);
                for (let i = 0; i < cards.length; ++i) {
                    const card = cards[i];
                    if (card.column_uid === data.archive_column_uid) {
                        card.order += data.count_all_cards_in_column;
                        continue;
                    }

                    card.column_uid = data.archive_column_uid;
                    card.archived_at = data.archived_at;
                }

                if (project.columns) {
                    project.columns = project.columns.filter((column) => column.uid !== data.uid);
                }
                return {};
            },
        },
    });
};

export default useBoardColumnDeletedHandlers;
