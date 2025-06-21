/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCardChecklistForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
}

const useDeleteCardChecklist = (options?: TMutationOptions<IDeleteCardChecklistForm>) => {
    const { mutate } = useQueryMutation();

    const deleteChecklist = async (params: IDeleteCardChecklistForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKLIST.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-card-checklist"], deleteChecklist, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardChecklist;
