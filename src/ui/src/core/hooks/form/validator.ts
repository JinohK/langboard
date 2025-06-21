import { EMAIL_REGEX } from "@/constants";
import { IBaseValidationSchema, TValidationSchema } from "@/core/hooks/form/types";
import TypeUtils from "@/core/utils/TypeUtils";

class Validator {
    public required(schemaValue: TValidationSchema["required"], value?: string | File[] | FileList): bool {
        return !schemaValue || !!value?.length;
    }

    public min(schemaValue: TValidationSchema["min"], value?: string | File[] | FileList): bool {
        return !schemaValue || (value?.length ?? 0) >= schemaValue;
    }

    public max(schemaValue: TValidationSchema["max"], value?: string | File[] | FileList): bool {
        return !schemaValue || (value?.length ?? schemaValue + 1) <= schemaValue;
    }

    public range(schemaValue: TValidationSchema["range"], value?: string | File[] | FileList): bool {
        return !schemaValue || ((value?.length ?? 0) >= schemaValue[0] && (value?.length ?? schemaValue[1] + 1) <= schemaValue[1]);
    }

    public pattern(schemaValue: TValidationSchema["pattern"], value?: string | File[] | FileList): bool {
        return !schemaValue || (TypeUtils.isString(value) && schemaValue.test(value));
    }

    public email(schemaValue: TValidationSchema["email"], value?: string | File[] | FileList): bool {
        return !schemaValue || (TypeUtils.isString(value) && EMAIL_REGEX.test(value));
    }

    public sameWith(
        schemaValue: TValidationSchema["sameWith"],
        value: string | File[] | FileList | undefined,
        form: HTMLFormElement | Record<string, string | File | DataTransfer>
    ): bool {
        if (!schemaValue) {
            return true;
        }

        const sameWith = form[schemaValue];
        if (form instanceof HTMLFormElement) {
            return value === sameWith.value.trim();
        } else {
            return value === sameWith.trim();
        }
    }

    public mimeType(schemaValue: TValidationSchema["mimeType"], value?: string | File[] | FileList): bool {
        if (!schemaValue || !value) {
            return true;
        }

        if (TypeUtils.isString(value)) {
            return false;
        }

        for (let i = 0; i < (value?.length ?? 0); ++i) {
            const file = value[i];
            if (TypeUtils.isString(schemaValue)) {
                schemaValue = [schemaValue];
            }

            let isValidMime = false;
            for (let j = 0; j < schemaValue.length; ++j) {
                const schemaMimeType = schemaValue[j];
                if (schemaMimeType.includes("/*")) {
                    if (file.type.startsWith(schemaMimeType.replace("/*", ""))) {
                        isValidMime = true;
                    }
                } else {
                    if (file.type === schemaMimeType) {
                        isValidMime = true;
                    }
                }
            }

            if (!isValidMime) {
                return false;
            }
        }

        return true;
    }

    public custom(schemaValue: TValidationSchema["custom"], value?: string | File[] | FileList): bool {
        return !schemaValue || !value || schemaValue.validate(value);
    }
}

export const validate = (
    form: HTMLFormElement | Record<string, string | File | DataTransfer>,
    value: string | File[] | FileList,
    schema: TValidationSchema
): keyof IBaseValidationSchema | (string & {}) | undefined => {
    const validator = new Validator();
    const keys = Object.keys(schema);

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const validate = validator[key] as Validator[typeof key];
        const schemaValue = schema[key] as TValidationSchema[typeof key];
        const result = validate(schemaValue as undefined, value, form);
        if (!result) {
            if (key === "custom" && schema.custom) {
                return `custom:${schema.custom!.errorKey}`;
            }
            return key;
        }
    }

    return undefined;
};
