import { Toast } from "@/components/base";
import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, User } from "@/core/models";
import { t } from "i18next";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface ISelectedUsersDeletedRawResponse {
    uids: string[];
}

export interface IUseSelectedUsersDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
    signOut: () => Promise<void>;
}

const useSelectedUsersDeletedHandlers = ({ currentUser, signOut, callback }: IUseSelectedUsersDeletedHandlersProps) => {
    return useSocketHandler<{}, ISelectedUsersDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "selected-user-deleted",
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.USERS.SELECTION_DELETED,
            callback,
            responseConverter: (data) => {
                if (data.uids.includes(currentUser.uid)) {
                    signOut().finally(() => {
                        Toast.Add.error(t("auth.You have been deleted."));
                    });
                } else {
                    User.Model.getModels(data.uids).forEach((user) => {
                        user.setDeleted();
                    });
                }
                return {};
            },
        },
    });
};

export default useSelectedUsersDeletedHandlers;
