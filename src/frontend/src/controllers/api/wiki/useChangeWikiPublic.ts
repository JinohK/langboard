import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeWikiPublicForm {
    project_uid: string;
    wiki_uid: string;
    is_public: bool;
}

export interface IChangeWikiPublicResponse {}

const useChangeWikiPublic = (options?: TMutationOptions<IChangeWikiPublicForm, IChangeWikiPublicResponse>) => {
    const { mutate } = useQueryMutation();

    const changeWikiPublic = async (params: IChangeWikiPublicForm) => {
        const url = format(API_ROUTES.BOARD.WIKI.CHANGE_PUBLIC, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.put(url, {
            is_public: params.is_public,
        });

        return res.data;
    };

    const result = mutate(["change-wiki-public"], changeWikiPublic, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeWikiPublic;
