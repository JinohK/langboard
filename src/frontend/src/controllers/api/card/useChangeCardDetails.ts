import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { IEditorContent } from "@/core/models/Base";
import { format } from "@/core/utils/StringUtils";

interface IBaseChangeCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

interface IDetails {
    title?: string;
    description?: IEditorContent;
    deadline_at?: Date;
}

type TChangeableDetail = keyof IDetails;

export type TChangeCardDetailsForm<TDetail extends TChangeableDetail> = IBaseChangeCardDetailsForm & Pick<IDetails, TDetail>;

const useChangeCardDetails = <TDetail extends TChangeableDetail>(type: TDetail, options?: TMutationOptions<TChangeCardDetailsForm<TDetail>>) => {
    const { mutate } = useQueryMutation();

    const changeCardDetails = async (params: TChangeCardDetailsForm<TDetail>) => {
        const url = format(API_ROUTES.BOARD.CARD.CHANGE_DETAILS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(url, {
            [type]: params[type],
        });

        return res.data;
    };

    const result = mutate(["change-card-details"], changeCardDetails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardDetails;
