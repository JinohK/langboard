/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel, ChatTemplateModel, InternalBotModel, Project, ProjectCard, ProjectColumn } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGetProjectDetailsForm {
    uid: string;
}

export interface IGetProjectDetailsResponse {
    project: Project.TModel;
    bots: BotModel.TModel[];
    internal_bots: InternalBotModel.TModel[];
    columns: ProjectColumn.TModel[];
    cards: ProjectCard.TModel[];
}

const useGetProjectDetails = (form: IGetProjectDetailsForm, options?: TQueryOptions<unknown, IGetProjectDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getProjectDetails = async () => {
        const url = Utils.String.format(API_ROUTES.BOARD.DETAILS, { uid: form.uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return {
            project: Project.Model.fromOne(res.data.project),
            bots: BotModel.Model.fromArray(res.data.bots),
            internal_bots: InternalBotModel.Model.fromArray(res.data.internal_bots),
            columns: ProjectColumn.Model.fromArray(res.data.columns),
            cards: ProjectCard.Model.fromArray(res.data.cards),
            chat_templates: ChatTemplateModel.Model.fromArray(res.data.chat_templates),
        };
    };

    const result = query([`get-project-details-${form.uid}`], getProjectDetails, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProjectDetails;
