import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitemTimer } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IToggleCheckitemTimerForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
}

export interface IToggleCheckitemTimerResponse extends IModelIdBase {
    timer: ProjectCheckitemTimer.Interface;
    acc_time_seconds: number;
}

const useToggleCheckitemTimer = (options?: TMutationOptions<IToggleCheckitemTimerForm, IToggleCheckitemTimerResponse>) => {
    const { mutate } = useQueryMutation();

    const toggleCheckitemTimer = async (params: IToggleCheckitemTimerForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.TOGGLE_TIMER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.post(url);

        ProjectCheckitemTimer.transformFromApi(res.data.timer);

        return res.data;
    };

    const result = mutate(["toggle-checkitem-timer"], toggleCheckitemTimer, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleCheckitemTimer;
