import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseGlobalRelationshipDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    globalRelationship: GlobalRelationshipType.TModel;
}

const useGlobalRelationshipDeletedHandlers = ({ callback, globalRelationship }: IUseGlobalRelationshipDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Global,
        eventKey: `global-relationship-deleted-${globalRelationship.uid}`,
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.GLOBAL_RELATIONSHIPS.DELETED,
            params: { uid: globalRelationship.uid },
            callback,
            responseConverter: () => {
                GlobalRelationshipType.Model.deleteModel(globalRelationship.uid);

                return {};
            },
        },
    });
};

export default useGlobalRelationshipDeletedHandlers;
