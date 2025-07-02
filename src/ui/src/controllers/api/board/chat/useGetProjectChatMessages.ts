/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatMessageModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { useEffect, useRef, useState } from "react";

const useGetProjectChatMessages = (projectUID: string, limit: number = 20, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    const getProjectChatMessages = async () => {
        if (isLastPage && pageRef.current) {
            return { isUpdated: false };
        }

        if (!ChatMessageModel.Model.getModel((model) => model.filterable_table === "project" && model.filterable_uid === projectUID)) {
            pageRef.current = 0;
        }

        ++pageRef.current;

        const url = Utils.String.format(API_ROUTES.BOARD.CHAT.GET_MESSAGES, { uid: projectUID });
        const res = await api.get(url, {
            params: {
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        ChatMessageModel.Model.fromArray(res.data.histories, true);

        setIsLastPage(res.data.histories.length < limit);

        return { isUpdated: true };
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        getProjectChatMessages();

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate([`get-project-chat-messages-${projectUID}`], getProjectChatMessages, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage };
};

export default useGetProjectChatMessages;
