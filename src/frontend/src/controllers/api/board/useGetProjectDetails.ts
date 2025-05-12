import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel, Project, ProjectCard, ProjectColumn } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectDetailsForm {
    uid: string;
}

export interface IGetProjectDetailsResponse {
    project: Project.TModel;
    bots: BotModel.TModel[];
    columns: ProjectColumn.TModel[];
    cards: ProjectCard.TModel[];
}

const useGetProjectDetails = (form: IGetProjectDetailsForm, options?: TQueryOptions<unknown, IGetProjectDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getProjectDetails = async () => {
        const url = format(API_ROUTES.BOARD.DETAILS, { uid: form.uid });
        const res = await api.get(url);

        return {
            project: Project.Model.fromObject(res.data.project),
            bots: BotModel.Model.fromObjectArray(res.data.bots),
            columns: ProjectColumn.Model.fromObjectArray(res.data.columns),
            cards: ProjectCard.Model.fromObjectArray(res.data.cards),
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
