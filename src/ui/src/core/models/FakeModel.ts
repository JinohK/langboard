/* eslint-disable @typescript-eslint/no-explicit-any */
import { type IBaseModel } from "@/core/models/Base";

const createFakeModel = <TModel extends IBaseModel, TMethodMap = undefined>(
    modelName: string,
    copiedModel: TModel,
    methodMap?: TMethodMap,
    foreignModels?: Record<keyof TModel, any[]>
): any => {
    return {
        MODEL_NAME: modelName,
        ...copiedModel,
        ...(methodMap ?? {}),
        asFake: () => createFakeModel(modelName, copiedModel, methodMap, foreignModels),
        useField: (field: keyof TModel) => copiedModel[field],
        useForeignField: (field: keyof TModel) => foreignModels?.[field],
    };
};

export default createFakeModel;
