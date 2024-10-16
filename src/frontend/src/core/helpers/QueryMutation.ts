import {
    InfiniteData,
    QueryClient,
    QueryFunction,
    QueryKey,
    useInfiniteQuery,
    UseInfiniteQueryOptions,
    useMutation,
    UseMutationOptions,
    UseMutationResult,
    useQuery,
    useQueryClient,
    UseQueryOptions,
    UseQueryResult,
} from "@tanstack/react-query";

export type TQueryOptions<TQueryFnData = unknown, TData = TQueryFnData, TError = Error> = UseQueryOptions<
    TQueryFnData,
    TError,
    TData
>;
export type TInfiniteQueryOptions<TQueryFnData, TPageParam = unknown, TError = Error> = Partial<
    UseInfiniteQueryOptions<TQueryFnData, TError, InfiniteData<TQueryFnData>, TQueryFnData, QueryKey, TPageParam>
>;
export type TQueryFunction<TQueryFnData = unknown, TData = TQueryFnData> = QueryFunction<TQueryFnData, QueryKey, TData>;
export type TMutationOptions<
    TVariables = unknown,
    TData = unknown,
    TContext = unknown,
    TError = Error,
> = UseMutationOptions<TData, TError, TVariables, TContext>;

export const useQueryMutation = (queryClient: QueryClient = useQueryClient()) => {
    function query<TQueryFnData = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TError = Error>(
        queryKey: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryKey"],
        queryFn: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryFn"],
        options: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn" | "queryKey"> = {}
    ): UseQueryResult<TData, TError> {
        return useQuery(
            {
                queryKey,
                queryFn,
                ...options,
            },
            queryClient
        );
    }

    function infiniteQuery<TQueryFnData, TPageParam = unknown, TQueryKey extends QueryKey = QueryKey, TError = Error>(
        queryKey: UseInfiniteQueryOptions<
            TQueryFnData,
            TError,
            InfiniteData<TQueryFnData>,
            TQueryFnData,
            TQueryKey,
            TPageParam
        >["queryKey"],
        queryFn: UseInfiniteQueryOptions<
            TQueryFnData,
            TError,
            InfiniteData<TQueryFnData>,
            TQueryFnData,
            TQueryKey,
            TPageParam
        >["queryFn"],
        nextPageParam: UseInfiniteQueryOptions<
            TQueryFnData,
            TError,
            InfiniteData<TQueryFnData>,
            TQueryFnData,
            TQueryKey,
            TPageParam
        >["getNextPageParam"],
        initialPageParam: UseInfiniteQueryOptions<
            TQueryFnData,
            TError,
            InfiniteData<TQueryFnData>,
            TQueryFnData,
            TQueryKey,
            TPageParam
        >["initialPageParam"],
        options: Omit<
            UseInfiniteQueryOptions<
                TQueryFnData,
                TError,
                InfiniteData<TQueryFnData>,
                TQueryFnData,
                TQueryKey,
                TPageParam
            >,
            "queryFn" | "queryKey" | "getNextPageParam" | "initialPageParam"
        > = {}
    ) {
        return useInfiniteQuery(
            {
                queryKey,
                queryFn,
                getNextPageParam: nextPageParam,
                initialPageParam,
                ...options,
            },
            queryClient
        );
    }

    function mutate<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error>(
        mutationKey: UseMutationOptions<TData, TError, TVariables, TContext>["mutationKey"],
        mutationFn: UseMutationOptions<TData, TError, TVariables, TContext>["mutationFn"],
        options: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn" | "mutationKey"> = {}
    ): UseMutationResult<TData, TError, TVariables, TContext> {
        return useMutation<TData, TError, TVariables, TContext>(
            {
                mutationKey,
                mutationFn,
                onSettled: (data, error, variables, context) => {
                    queryClient.invalidateQueries({ queryKey: mutationKey });
                    if (options.onSettled) {
                        options.onSettled(data, error, variables, context);
                    }
                },
                ...options,
            },
            queryClient
        );
    }

    return { query, infiniteQuery, mutate, queryClient };
};
