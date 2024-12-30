import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitem } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICreateSubCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    title: string;
    assigned_users?: string[];
}

export interface ICreateSubCheckitemResponse {
    checkitem: ProjectCheckitem.TModel;
}

const useCreateSubCheckitem = (options?: TMutationOptions<ICreateSubCheckitemForm, ICreateSubCheckitemResponse>) => {
    const { mutate } = useQueryMutation();

    const createSubCheckitem = async (params: ICreateSubCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.SUB_CHECKITEM.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.post(url, {
            title: params.title,
            assigned_users: params.assigned_users,
        });

        res.data.checkitem.project_uid = params.project_uid;

        return {
            checkitem: ProjectCheckitem.Model.fromObject(res.data.checkitem),
        };
    };

    const result = mutate(["create-sub-checkitem"], createSubCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateSubCheckitem;
