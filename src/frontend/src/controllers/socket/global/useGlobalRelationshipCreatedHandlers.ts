import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";

export interface IGlobalRelationshipCreatedRawResponse {
    global_relationship: GlobalRelationshipType.Interface;
}

const useGlobalRelationshipCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IGlobalRelationshipCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "global-relationship-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.GLOBAL_RELATIONSHIPS.CREATED,
            callback,
            responseConverter: (data) => {
                GlobalRelationshipType.Model.fromObject(data.global_relationship, true);
                return {};
            },
        },
    });
};

export default useGlobalRelationshipCreatedHandlers;
