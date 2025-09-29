import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectLabel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardLabelCreatedRawResponse {
    label: ProjectLabel.Interface;
}

export interface IUseBoardLabelCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    project: Project.TModel;
}

const useBoardLabelCreatedHandlers = ({ callback, project }: IUseBoardLabelCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardLabelCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: project.uid,
        eventKey: `board-label-created-${project.uid}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.LABEL.CREATED,
            params: { uid: project.uid },
            callback,
            responseConverter: (data) => {
                project.labels = [...project.labels, data.label];
                return {};
            },
        },
    });
};

export default useBoardLabelCreatedHandlers;
