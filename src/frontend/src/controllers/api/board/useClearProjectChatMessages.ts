import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IClearProjectChatMessagesForm {
    uid: string;
}

const useClearProjectChatMessages = (options?: TMutationOptions<IClearProjectChatMessagesForm>) => {
    const { mutate } = useQueryMutation();

    const clearProjectChatMessages = async (params: IClearProjectChatMessagesForm) => {
        const url = format(API_ROUTES.BOARD.CHAT.CLEAR_MESSAGES, { uid: params.uid });
        const res = await api.delete(url);

        return res.data;
    };

    const result = mutate(["clear-project-chat-messages"], clearProjectChatMessages, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useClearProjectChatMessages;
