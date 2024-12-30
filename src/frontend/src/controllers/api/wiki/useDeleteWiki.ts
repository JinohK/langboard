import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteWikiForm {
    project_uid: string;
    wiki_uid: string;
}

const useDeleteWiki = (options?: TMutationOptions<IDeleteWikiForm>) => {
    const { mutate } = useQueryMutation();

    const deleteWiki = async (params: IDeleteWikiForm) => {
        const url = format(API_ROUTES.BOARD.WIKI.DELETE, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.delete(url);
        return res.data;
    };

    const result = mutate(["delete-wiki"], deleteWiki, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteWiki;
