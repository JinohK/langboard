import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, ProjectCard, ProjectCardAttachment, ProjectCheckitemTimer, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardDetailsResponse {
    card: ProjectCard.IBoardWithDetails;
    current_user_role_actions: Project.TRoleActions[];
}

const useGetCardDetails = (params: IGetCardDetailsForm, options?: TQueryOptions<IGetCardDetailsForm, IGetCardDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getCardDetails = async () => {
        const url = format(API_ROUTES.BOARD.CARD.GET_DETAILS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        res.data.card.is_archived = res.data.card.column_uid === res.data.card.project_archive_column_uid;

        User.transformFromApi(res.data.card.members);
        User.transformFromApi(res.data.card.project_members);

        if (res.data.card.deadline_at) {
            res.data.card.deadline_at = new Date(res.data.card.deadline_at);
        }

        for (let i = 0; i < res.data.card.attachments.length; ++i) {
            User.transformFromApi(res.data.card.attachments[i].user);
            ProjectCardAttachment.transformFromApi(res.data.card.attachments[i]);
        }

        for (let i = 0; i < res.data.card.checkitems.length; ++i) {
            ProjectCheckitemTimer.transformFromApi(res.data.card.checkitems[i].timer);
            User.transformFromApi(res.data.card.checkitems[i].assigned_members);
            for (let j = 0; j < res.data.card.checkitems[i].sub_checkitems.length; ++j) {
                ProjectCheckitemTimer.transformFromApi(res.data.card.checkitems[i].sub_checkitems[j].timer);
                User.transformFromApi(res.data.card.checkitems[i].sub_checkitems[j].assigned_members);
            }
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
