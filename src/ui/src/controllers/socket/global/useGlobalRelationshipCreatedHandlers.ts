import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
                GlobalRelationshipType.Model.fromOne(data.global_relationship, true);
                return {};
            },
        },
    });
};

export default useGlobalRelationshipCreatedHandlers;
