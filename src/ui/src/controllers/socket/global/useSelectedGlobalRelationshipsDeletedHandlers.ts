import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ISelectedGlobalRelationshipsDeletedRawResponse {
    uids: string[];
}

const useSelectedGlobalRelationshipsDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, ISelectedGlobalRelationshipsDeletedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "selected-global-relationship-deleted",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.GLOBAL_RELATIONSHIPS.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                GlobalRelationshipType.Model.deleteModels(data.uids);

                return {};
            },
        },
    });
};

export default useSelectedGlobalRelationshipsDeletedHandlers;
