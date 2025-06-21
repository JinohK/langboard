import { useRef, useState } from "react";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IUseForm, TFormDataType, TUseFormProps } from "@/core/hooks/form/types";
import { convertValidationToLangKey, handleResponseErrors } from "@/core/hooks/form/utils";
import { validate } from "@/core/hooks/form/validator";
import TypeUtils from "@/core/utils/TypeUtils";

const useForm = <TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends bool = bool>({
    errorLangPrefix,
    schema,
    isValidatingState,
    isFormData,
    inputRefs,
    beforeHandleSubmit,
    predefineValues,
    failCallback,
    successCallback,
    mutate,
    mutateOnSuccess,
    mutateOnError,
    mutateOnSettled,
    apiErrorHandlers,
    useDefaultBadRequestHandler,
    badRequestHandlerCallback,
}: TUseFormProps<TVariables, TData, TContext, TError, TFormData>): IUseForm<TVariables, TFormData> => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = isValidatingState ? isValidatingState : useState(false);
    const formDataRef = useRef<TFormDataType<TFormData, TVariables>>((isFormData ? new FormData() : {}) as TFormDataType<TFormData, TVariables>);
    const focusComponentRef = useRef<HTMLInputElement | string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    const handleSubmit = (formOrEvent: React.FormEvent<HTMLFormElement> | HTMLFormElement | Record<string, string | File | DataTransfer>) => {
        if (isValidating) {
            return;
        }

        let form: HTMLFormElement | Record<string, string | File | DataTransfer>;
        if (formOrEvent.nativeEvent instanceof Event) {
            formOrEvent.preventDefault();
            formOrEvent.stopPropagation();
            form = formOrEvent.currentTarget as HTMLFormElement;
        } else {
            form = formOrEvent as HTMLFormElement;
        }

        beforeHandleSubmit?.();

        focusComponentRef.current = null;
        formDataRef.current = (isFormData ? new FormData() : {}) as TFormDataType<TFormData, TVariables>;
        setIsValidating(true);

        if (predefineValues) {
            const predefinedValues = TypeUtils.isFunction(predefineValues) ? predefineValues() : predefineValues;
            if (isFormData) {
                Object.entries(predefinedValues).forEach(([key, value]) => {
                    if (value instanceof DataTransfer) {
                        for (let i = 0; i < value.files.length; ++i) {
                            (formDataRef.current as FormData).append(key as string, value.files[i], value.files[i].name);
                        }
                    } else if (value instanceof FileList) {
                        for (let i = 0; i < value.length; ++i) {
                            (formDataRef.current as FormData).append(key as string, value[i], value[i].name);
                        }
                    } else if (value instanceof File) {
                        (formDataRef.current as FormData).append(key as string, value, value.name);
                    } else if (Array.isArray(value)) {
                        value.forEach((v) => {
                            (formDataRef.current as FormData).append(key as string, v);
                        });
                    } else {
                        (formDataRef.current as FormData).append(key as string, value as string);
                    }
                });
            } else {
                formDataRef.current = { ...predefinedValues } as TFormDataType<TFormData, TVariables>;
            }
        }

        const newErrors: typeof errors = {};

        const validationSchema = TypeUtils.isFunction(schema) ? schema() : schema;

        Object.entries(validationSchema).forEach(([inputName, scheme]) => {
            let input = form[inputName];
            let inputValue: string | File[] | FileList;

            if (inputRefs && inputRefs[inputName]) {
                input = inputRefs[inputName].current;
                if (!input) {
                    return;
                }

                if (input instanceof DataTransfer) {
                    inputValue = input.files;
                } else if (TypeUtils.isString(input)) {
                    inputValue = input.trim();
                } else if (TypeUtils.isBool(input)) {
                    inputValue = input.toString();
                } else {
                    inputValue = input.value.trim();
                }
            } else {
                if (form instanceof HTMLFormElement) {
                    if (input.type === "file") {
                        inputValue = input.files;
                    } else {
                        inputValue = input.value.trim();
                    }
                } else {
                    if (input instanceof File) {
                        inputValue = [input];
                    } else if (input instanceof DataTransfer) {
                        inputValue = input.files;
                    } else if (TypeUtils.isString(input)) {
                        inputValue = input.trim();
                    } else {
                        inputValue = input;
                    }
                }
            }

            const error = validate(form, inputValue, scheme);
            if (error) {
                newErrors[inputName] = convertValidationToLangKey(errorLangPrefix, error, inputName);
                if (!focusComponentRef.current) {
                    if (form instanceof HTMLFormElement) {
                        focusComponentRef.current = form[inputName];
                    } else {
                        focusComponentRef.current = inputName;
                    }
                }
            }

            if (isFormData) {
                if (TypeUtils.isString(inputValue)) {
                    (formDataRef.current as FormData).append(inputName, inputValue);
                } else {
                    for (let i = 0; i < inputValue.length; ++i) {
                        (formDataRef.current as FormData).append(inputName, inputValue[i], inputValue[i].name);
                    }
                }
            } else {
                (formDataRef.current as Record<string, unknown>)[inputName] = inputValue;
            }
        });

        if (focusComponentRef.current) {
            setErrors(newErrors);
            setIsValidating(false);
            if (formRef.current) {
                if (TypeUtils.isString(focusComponentRef.current)) {
                    (formRef.current[focusComponentRef.current] as HTMLInputElement).focus();
                } else if (TypeUtils.isElement(focusComponentRef.current)) {
                    (focusComponentRef.current as HTMLInputElement).focus();
                }
            }
            failCallback?.(newErrors);
            return;
        }

        if (!mutate) {
            successCallback!(formDataRef.current as FormData & TVariables);
            return;
        }

        let onError = mutateOnError;
        if (apiErrorHandlers || useDefaultBadRequestHandler) {
            const handlers = { ...(apiErrorHandlers ?? {}) };
            if (useDefaultBadRequestHandler) {
                handlers[EHttpStatus.HTTP_400_BAD_REQUEST] = {
                    message: (_, responseErrors) => {
                        const handledErrors = handleResponseErrors(errorLangPrefix, responseErrors);
                        if (handledErrors) {
                            setErrors(handledErrors);
                            const firstFieldName = Object.keys(handledErrors)[0];
                            if (firstFieldName) {
                                focusComponentRef.current = formRef.current?.[firstFieldName] ?? firstFieldName;
                                formRef.current?.[firstFieldName]?.focus();
                            }
                        }

                        badRequestHandlerCallback?.(handledErrors, focusComponentRef.current);
                    },
                };
            }

            onError = (error) => {
                const { handle } = setupApiErrorHandler(handlers);
                handle(error);
            };
        }

        mutate(formDataRef.current as TVariables, {
            onSuccess: mutateOnSuccess,
            onError,
            onSettled: (data, error, variables, context) => {
                setIsValidating(false);
                mutateOnSettled?.(data, error, variables, context);
            },
        });
    };

    return {
        errors,
        setErrors,
        isValidating,
        setIsValidating,
        handleSubmit,
        formRef,
        formDataRef,
        focusComponentRef,
    };
};

export default useForm;
