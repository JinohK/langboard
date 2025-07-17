/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import {
    ProjectCardBotScope,
    GlobalRelationshipType,
    ProjectCard,
    ProjectCardAttachment,
    ProjectChecklist,
    ProjectColumn,
    ProjectLabel,
} from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGetCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardDetailsResponse {
    card: ProjectCard.TModel;
    attachments: ProjectCardAttachment.TModel[];
    checklists: ProjectChecklist.TModel[];
    global_relationships: GlobalRelationshipType.TModel[];
    project_columns: ProjectColumn.TModel[];
    project_labels: ProjectLabel.TModel[];
    bot_scopes: ProjectCardBotScope.TModel[];
}

const useGetCardDetails = (params: IGetCardDetailsForm, options?: TQueryOptions<unknown, IGetCardDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getCardDetails = async () => {
        const url = Utils.String.format(API_ROUTES.BOARD.CARD.GET_DETAILS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return {
            card: ProjectCard.Model.fromOne(res.data.card),
            attachments: ProjectCardAttachment.Model.fromArray(res.data.attachments, true),
            checklists: ProjectChecklist.Model.fromArray(res.data.checklists, true),
            global_relationships: GlobalRelationshipType.Model.fromArray(res.data.global_relationships, true),
            project_columns: ProjectColumn.Model.fromArray(res.data.project_columns, true),
            project_labels: ProjectLabel.Model.fromArray(res.data.project_labels, true),
            bot_scopes: ProjectCardBotScope.Model.fromArray(res.data.bot_scopes, true),
        };
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
