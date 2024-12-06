import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICreateSubCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    title: string;
    assignees?: number[];
}

export interface ICreateSubCheckitemResponse extends IModelIdBase {
    checkitem: ProjectCheckitem.IBoardSub;
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
            assignees: params.assignees,
        });

        ProjectCheckitemTimer.transformFromApi(res.data.checkitem.timer);
        User.transformFromApi(res.data.checkitem.assigned_members);

        return res.data;
    };

    const result = mutate(["create-sub-checkitem"], createSubCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateSubCheckitem;
