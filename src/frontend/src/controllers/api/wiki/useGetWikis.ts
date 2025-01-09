import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel, ProjectWiki, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetWikisForm {
    project_uid: string;
}

export interface IGetWikisResponse {
    wikis: ProjectWiki.TModel[];
    project_members: User.TModel[];
    project_bots: BotModel.TModel[];
}

const useGetWikis = (params: IGetWikisForm, options?: TQueryOptions<unknown, IGetWikisResponse>) => {
    const { query } = useQueryMutation();

    const getWikis = async () => {
        const url = format(API_ROUTES.BOARD.WIKI.GET_ALL, { uid: params.project_uid });
        const res = await api.get(url);

        return {
            wikis: ProjectWiki.Model.fromObjectArray(res.data.wikis),
            project_members: User.Model.fromObjectArray(res.data.project_members),
            project_bots: BotModel.Model.fromObjectArray(res.data.project_bots),
        };
    };

    const result = query([`get-wikis-${params.project_uid}`], getWikis, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetWikis;
