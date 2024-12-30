/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IBaseModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";

const createFakeModel = <TModel extends IBaseModel, TMethodMap = undefined>(
    model: TModel,
    methodMap?: TMethodMap,
    foreignModels?: (keyof TModel)[]
): any => {
    const copiedModel = { ...model };
    const foreigns: Partial<Record<keyof TModel, any[]>> = {};
    if (foreignModels) {
        for (let i = 0; i < foreignModels.length; ++i) {
            const key = foreignModels[i];
            if (!copiedModel[key]) {
                continue;
            }

            if (!foreigns[key]) {
                foreigns[key] = [];
            }

            if (!TypeUtils.isArray(copiedModel[key])) {
                copiedModel[key] = [copiedModel[key]] as any;
            }

            const targetFields = copiedModel[key] as any[];

            for (let i = 0; i < targetFields.length; ++i) {
                const targetField = targetFields[i];
                foreigns[key].push(createFakeModel(targetField));
            }
        }
    }

    return {
        ...copiedModel,
        ...(methodMap ?? {}),
        asFake: () => createFakeModel(copiedModel, methodMap, foreignModels),
        useField: (field: keyof TModel) => copiedModel[field],
        useForeignField: (field: keyof TModel) => foreigns[field],
    };
};

export default createFakeModel;
