import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitem } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCheckitemForm {
    project_uid: string;
    card_uid: string;
    title: string;
    assigned_users?: string[];
}

export interface ICreateCheckitemResponse {
    checkitem: ProjectCheckitem.TModel;
}

const useCreateCheckitem = (options?: TMutationOptions<ICreateCheckitemForm, ICreateCheckitemResponse>) => {
    const { mutate } = useQueryMutation();

    const createCheckitem = async (params: ICreateCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
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

    const result = mutate(["create-checkitem"], createCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCheckitem;
