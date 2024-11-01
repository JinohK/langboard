import { TResponseErrors } from "@/core/helpers/setupApiErrorHandler";
import { IBaseValidationSchema } from "@/core/hooks/form/types";

export const convertValidationName = (key: string) => {
    switch (key) {
        case "required":
        case "missing":
            return "missing";
        case "min":
            return "min";
        case "max":
            return "max";
        case "range":
            return "range";
        case "pattern":
        case "email":
        case "sameWith":
        case "mimeType":
        case "value_error":
        default:
            return "invalid";
    }
};

export const convertValidationToLangKey = (prefix: string, key: keyof IBaseValidationSchema | (string & {}), inputName: string) =>
    `${prefix}.${convertValidationName(key)}.${inputName}`;

export const handleResponseErrors = (prefix: string, errors: TResponseErrors) => {
    if (!errors) {
        return undefined;
    }

    const newErrors: Record<string, string> = {};
    const errorTypes = Object.keys(errors);

    for (let i = 0; i < errorTypes.length; ++i) {
        const errorType = errorTypes[i];
        const errorFields = errors[errorType]?.body;
        if (!errorFields) {
            continue;
        }

        for (let j = 0; j < errorFields.length; ++j) {
            const fieldName = errorFields[j];
            newErrors[fieldName] = convertValidationToLangKey(prefix, errorType, fieldName);
        }
    }

    return newErrors;
};
