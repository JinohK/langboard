import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";

export interface IGlobalRelationshipUpdatedRawResponse {
    parent_name?: string;
    child_name?: string;
    description?: string;
}

export interface IUseGlobalRelationshipUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    globalRelationship: GlobalRelationshipType.TModel;
}

const useGlobalRelationshipUpdatedHandlers = ({ callback, globalRelationship }: IUseGlobalRelationshipUpdatedHandlersProps) => {
    return useSocketHandler<{}, IGlobalRelationshipUpdatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: `global-relationship-updated-${globalRelationship.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.GLOBAL_RELATIONSHIPS.UPDATED,
            params: { uid: globalRelationship.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    globalRelationship[key] = value as string;
                });

                return {};
            },
        },
    });
};

export default useGlobalRelationshipUpdatedHandlers;
