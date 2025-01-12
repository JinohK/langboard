import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatMessageModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { useEffect, useRef, useState } from "react";

export interface IGetProjectChatMessagesForm {
    current_date: Date;
}

const useGetProjectChatMessages = (projectUID: string, limit: number = 20, options?: TMutationOptions<IGetProjectChatMessagesForm>) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const pageRef = useRef(0);

    const getProjectChatMessages = async (params: IGetProjectChatMessagesForm) => {
        if (isLastPage && pageRef.current) {
            return { isUpdated: false };
        }

        ++pageRef.current;

        const url = format(API_ROUTES.BOARD.CHAT_MESSAGES, { uid: projectUID });
        const res = await api.get(url, {
            params: {
                ...params,
                page: pageRef.current,
                limit,
            },
        });

        for (let i = 0; i < res.data.histories.length; ++i) {
            const history = res.data.histories[i];
            history.projectUID = projectUID;
        }

        ChatMessageModel.Model.fromObjectArray(res.data.histories, true);

        setIsLastPage(res.data.histories.length < limit);

        return { isUpdated: true };
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        getProjectChatMessages({ current_date: new Date() });
    }, []);

    const result = mutate([`get-project-chat-messages-${projectUID}`], getProjectChatMessages, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage };
};

export default useGetProjectChatMessages;
