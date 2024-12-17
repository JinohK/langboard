import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { IEditorContent } from "@/core/models/Base";
import { format } from "@/core/utils/StringUtils";

interface IBaseChangeWikiDetailsForm {
    project_uid: string;
    wiki_uid: string;
}

interface IDetails {
    title?: string;
    content?: IEditorContent;
}

type TChangeableDetail = keyof IDetails;

export type TChangeWikiDetailsForm<TDetail extends TChangeableDetail> = IBaseChangeWikiDetailsForm & Pick<IDetails, TDetail>;
export type TChangeWikiDetailsResponse<TDetail extends TChangeableDetail> = Required<Pick<IDetails, TDetail>>;

const useChangeWikiDetails = <TDetail extends TChangeableDetail>(
    type: TDetail,
    options?: TMutationOptions<TChangeWikiDetailsForm<TDetail>, TChangeWikiDetailsResponse<TDetail>>
) => {
    const { mutate } = useQueryMutation();

    const changeWikiDetails = async (params: TChangeWikiDetailsForm<TDetail>) => {
        const url = format(API_ROUTES.BOARD.WIKI.CHANGE_DETAILS, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.put(url, {
            [type]: params[type],
        });

        return res.data;
    };

    const result = mutate(["change-wiki-details"], changeWikiDetails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeWikiDetails;
