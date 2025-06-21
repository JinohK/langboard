/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseModel, type IBaseModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";

const createFakeModel = <TModel extends IBaseModel, TMethodMap = undefined>(
    copiedModel: TModel,
    methodMap?: TMethodMap,
    foreignModels?: (keyof TModel)[]
): any => {
    const foreigns: Partial<Record<keyof TModel, any[]>> = {};
    if (foreignModels) {
        for (let i = 0; i < foreignModels.length; ++i) {
            const key = foreignModels[i];
            if (!copiedModel[key]) {
                continue;
            }

            if (!TypeUtils.isArray(copiedModel[key])) {
                copiedModel[key] = [copiedModel[key]] as any;
            }

            const models = copiedModel[key] as any[];
            Object.defineProperty(foreigns, key, {
                get: () => {
                    const result = [];
                    for (let i = 0; i < models.length; ++i) {
                        const foreignModel = models[i];
                        if (foreignModel instanceof BaseModel) {
                            result.push(foreignModel.asFake());
                        } else {
                            result.push(createFakeModel(foreignModel));
                        }
                    }
                    return result;
                },
                set: (_: any[]) => {
                    return;
                },
            });
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
