import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface INotifyCardCheckGroupForm {
    project_uid: string;
    card_uid: string;
    check_group_uid: string;
    member_uids: string[];
}

const useNotifyCardCheckGroup = (options?: TMutationOptions<INotifyCardCheckGroupForm>) => {
    const { mutate } = useQueryMutation();

    const notifyCheckGroup = async (params: INotifyCardCheckGroupForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.NOTIFY, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            check_group_uid: params.check_group_uid,
        });
        const res = await api.post(url, {
            member_uids: params.member_uids,
        });

        return res.data;
    };

    const result = mutate(["notify-card-check-group"], notifyCheckGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useNotifyCardCheckGroup;
