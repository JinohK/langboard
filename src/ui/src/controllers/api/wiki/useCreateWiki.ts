/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectWiki } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICreateWikiForm {
    project_uid: string;
    title: string;
}

export interface ICreateWikiResponse {
    wiki: ProjectWiki.TModel;
}

const useCreateWiki = (options?: TMutationOptions<ICreateWikiForm, ICreateWikiResponse>) => {
    const { mutate } = useQueryMutation();

    const createWiki = async (params: ICreateWikiForm) => {
        const url = format(API_ROUTES.BOARD.WIKI.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                title: params.title,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return {
            wiki: ProjectWiki.Model.fromOne(res.data.wiki, true),
        };
    };

    const result = mutate(["create-wiki"], createWiki, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateWiki;
