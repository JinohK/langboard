import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectWiki, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetWikisForm {
    project_uid: string;
}

export interface IGetWikisResponse {
    wikis: ProjectWiki.Interface[];
    project_members: User.Interface[];
}

const useGetWikis = (params: IGetWikisForm, options?: TQueryOptions<IGetWikisForm, IGetWikisResponse>) => {
    const { query } = useQueryMutation();

    const getWikis = async () => {
        const url = format(API_ROUTES.BOARD.WIKI.GET_ALL, { uid: params.project_uid });
        const res = await api.get(url);

        for (let i = 0; i < res.data.wikis.length; ++i) {
            User.transformFromApi(res.data.wikis[i].assigned_members);
        }

        User.transformFromApi(res.data.project_members);

        return res.data;
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
