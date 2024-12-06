import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatMessageModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectChatMessagesForm {
    project_uid: string;
    current_date: Date;
    page: number;
    limit: number;
}

export interface IGetProjectChatMessagesResponse {
    histories: ChatMessageModel.Interface[];
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

        ChatMessageModel.transformFromApi(res.data.histories);

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
