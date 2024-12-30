import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeProjectColumnNameForm {
    project_uid: string;
    column_uid: string;
    name: string;
}

const useChangeProjectColumnName = (options?: TMutationOptions<IChangeProjectColumnNameForm>) => {
    const { mutate } = useQueryMutation();

    const changeProjectColumnName = async (params: IChangeProjectColumnNameForm) => {
        const url = format(API_ROUTES.BOARD.COLUMN.CHANGE_NAME, {
            uid: params.project_uid,
            column_uid: params.column_uid,
        });
        const res = await api.put(url, {
            name: params.name,
        });

        return res.data;
    };

    const result = mutate(["change-project-column-name"], changeProjectColumnName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectColumnName;
