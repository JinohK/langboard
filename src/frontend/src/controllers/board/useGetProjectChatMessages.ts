import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectChatMessagesForm {
    project_uid: string;
    current_date: Date;
    page: number;
    limit: number;
}

export interface IChatMessage {
    uid: string;
    icon?: string;
    message: string;
    isReceived: boolean;
}

export interface IGetProjectChatMessagesResponse {
    histories: IChatMessage[];
    total: number;
}

const useGetProjectChatMessages = (
    params: IGetProjectChatMessagesForm,
    options?: TInfiniteQueryOptions<IGetProjectChatMessagesResponse, IGetProjectChatMessagesForm>
) => {
    const { infiniteQuery } = useQueryMutation();

    const getProjectChatMessages: TQueryFunction<IGetProjectChatMessagesResponse, IGetProjectChatMessagesForm> = async ({ pageParam }) => {
        const url = format(API_ROUTES.BOARD.CHAT_MESSAGES, { uid: params.project_uid });
        const res = await api.get(url, {
            params: {
                current_date: params.current_date,
                page: pageParam.page,
                limit: params.limit,
            },
        });

        for (let i = 0; i < res.data.histories.length; ++i) {
            if (!res.data.histories[i].sender_id) {
                res.data.histories[i].isReceived = true;
            } else {
                res.data.histories[i].isReceived = false;
            }
        }

        return res.data;
    };

    const nextPageParam = options?.getNextPageParam;
    delete options?.getNextPageParam;
    delete options?.initialPageParam;

    const result = infiniteQuery<IGetProjectChatMessagesResponse, IGetProjectChatMessagesForm>(
        [`get-project-chat-messages-${params.project_uid}`],
        getProjectChatMessages,
        (lastPage, allPages, lastPageParam, allPageParams) => {
            if (nextPageParam) {
                return nextPageParam(lastPage, allPages, lastPageParam, allPageParams);
            }

            return lastPageParam;
        },
        params,
        {
            ...options,
            retry: false,
            staleTime: Infinity,
        }
    );

    return result;
};

export default useGetProjectChatMessages;
