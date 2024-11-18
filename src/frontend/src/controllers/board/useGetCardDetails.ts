import { API_URL } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, ProjectCard, ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

export interface IBaseBoardCardCheckitem extends ProjectCheckitem.Interface {
    user: User.Interface;
    timer?: ProjectCheckitemTimer.Interface;
    acc_time: number;
}

export interface IBoardCardSubCheckitem extends IBaseBoardCardCheckitem {
    checkitem_uid: string;
}

export interface IBoardCardCheckitem extends IBaseBoardCardCheckitem {
    sub_checkitems: IBoardCardSubCheckitem[];
}

export interface IBoardCardFile {
    uid: string;
    user: User.Interface;
    name: string;
    url: string;
    order: number;
    created_at: Date;
}

export interface IBoardCardWithDetails extends ProjectCard.Interface {
    deadline_at?: Date;
    column_name: string;
    members: User.Interface[];
    relationships: {
        parent_icon?: string;
        parent_name: string;
        child_icon?: string;
        child_name: string;
        description: string;
        is_parent: bool;
        related_card: ProjectCard.Interface;
    }[];
    files: IBoardCardFile[];
    checkitems: IBoardCardCheckitem[];
}

export interface IGetCardDetailsResponse {
    card: IBoardCardWithDetails;
    current_user_role_actions: Project.TRoleActions[];
}

const useGetCardDetails = (params: IGetCardDetailsForm, options?: TQueryOptions<IGetCardDetailsForm, IGetCardDetailsResponse>) => {
    const { query } = useQueryMutation();

    const transformCheckitemTimerDate = (checkitem: IBoardCardCheckitem) => {
        if (checkitem.timer) {
            checkitem.timer.started_at = new Date(checkitem.timer.started_at);
            if (checkitem.timer.ended_at) {
                checkitem.timer.ended_at = new Date(checkitem.timer.ended_at);
            }
        }
    };

    const getCardDetails = async () => {
        const url = format(API_ROUTES.BOARD.CARD.GET_DETAILS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        if (res.data.card.deadline_at) {
            res.data.card.deadline_at = new Date(res.data.card.deadline_at);
        }

        for (let i = 0; i < res.data.card.checkitems.length; ++i) {
            transformCheckitemTimerDate(res.data.card.checkitems[i]);
            for (let j = 0; j < res.data.card.checkitems[i].sub_checkitems.length; ++j) {
                transformCheckitemTimerDate(res.data.card.checkitems[i].sub_checkitems[j]);
            }
        }

        for (let i = 0; i < res.data.card.files.length; ++i) {
            res.data.card.files[i].url = `${API_URL}${res.data.card.files[i].url}`;
            res.data.card.files[i].created_at = new Date(res.data.card.files[i].created_at);
        }

        return res.data;
    };

    const result = query([`get-card-details-${params.card_uid}`], getCardDetails, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetCardDetails;
