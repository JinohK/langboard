/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

interface IChangeProjectDetailsForm {
    title: string;
    description?: string;
    project_type: string;
}

interface IChangeProjectDetailsResponse {}

const useChangeProjectDetails = (projectUID: string, options?: TMutationOptions<IChangeProjectDetailsForm, IChangeProjectDetailsResponse>) => {
    const { mutate } = useQueryMutation();

    const changeProjectDetails = async (params: IChangeProjectDetailsForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.UPDATE_DETAILS, { uid: projectUID });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["change-project-details"], changeProjectDetails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectDetails;
