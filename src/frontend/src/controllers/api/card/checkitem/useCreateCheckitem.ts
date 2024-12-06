import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCheckitemForm {
    project_uid: string;
    card_uid: string;
    title: string;
    assignees?: number[];
}

export interface ICreateCheckitemResponse extends IModelIdBase {
    checkitem: ProjectCheckitem.IBoard;
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
            assignees: params.assignees,
        });

        ProjectCheckitemTimer.transformFromApi(res.data.checkitem.timer);
        User.transformFromApi(res.data.checkitem.assigned_members);
        for (let i = 0; i < res.data.checkitem.sub_checkitems.length; ++i) {
            ProjectCheckitemTimer.transformFromApi(res.data.checkitem.sub_checkitems[i].timer);
            User.transformFromApi(res.data.checkitem.sub_checkitems[i].assigned_members);
        }

        return res.data;
    };

    const result = mutate(["create-checkitem"], createCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCheckitem;
