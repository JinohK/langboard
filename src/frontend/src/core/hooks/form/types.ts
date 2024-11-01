import { IApiErrorHandlerMap } from "@/core/helpers/setupApiErrorHandler";
import { MutateOptions, UseMutateFunction } from "@tanstack/react-query";

export interface IBaseValidationSchema {
    required?: bool;
    min?: number;
    max?: number;
    range?: [number, number];
    pattern?: RegExp;
    email?: bool;
    sameWith?: string;
    mimeType?: string | string[];
}

interface IFileValidationSchema extends IBaseValidationSchema {
    pattern?: undefined;
    email?: undefined;
    mimeType: string;
}

export type TValidationSchema = IBaseValidationSchema | IFileValidationSchema;

interface IBaseUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends bool = false> {
    errorLangPrefix: string;
    schema: Record<string, TValidationSchema> | (() => Record<string, TValidationSchema>);
    isFormData?: TFormData;
    inputRefs?: Record<string, React.RefObject<HTMLInputElement | null> | React.MutableRefObject<DataTransfer>>;
    beforeHandleSubmit?: () => void;
    predefineValues?: Partial<TVariables> | (() => Partial<TVariables>);
    successCallback?: (form: TFormData extends true ? FormData : TVariables) => void;
    failCallback?: (errors?: Record<string, string>) => void;
    mutate?: UseMutateFunction<TData, TError, TVariables, TContext>;
    mutateOnSuccess?: MutateOptions<TData, TError, TVariables, TContext>["onSuccess"];
    mutateOnError?: MutateOptions<TData, TError, TVariables, TContext>["onError"];
    mutateOnSettled?: MutateOptions<TData, TError, TVariables, TContext>["onSettled"];
    apiErrorHandlers?: IApiErrorHandlerMap;
    useDefaultBadRequestHandler?: bool;
    badRequestHandlerCallback?: (errors?: Record<string, string>, focusElement?: string | HTMLInputElement | null) => void;
}

interface IFormDataUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends true = true>
    extends IBaseUseFormProps<TVariables, TData, TContext, TError, TFormData> {
    successCallback: (form: TFormData extends true ? FormData : TVariables) => void;
    isFormData: TFormData;
}

interface IFormUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends false = false>
    extends IBaseUseFormProps<TVariables, TData, TContext, TError, TFormData> {
    successCallback: (form: TFormData extends true ? FormData : TVariables) => void;
    isFormData?: TFormData;
}

interface IBaseMutateUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends false = false>
    extends IBaseUseFormProps<TVariables, TData, TContext, TError, TFormData> {
    successCallback?: undefined;
    isFormData?: TFormData;
    mutate: UseMutateFunction<TData, TError, TVariables, TContext>;
}

interface IMutateErrorCallbackUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error>
    extends IBaseMutateUseFormProps<TVariables, TData, TContext, TError> {
    mutate: UseMutateFunction<TData, TError, TVariables, TContext>;
    mutateOnError?: MutateOptions<TData, TError, TVariables, TContext>["onError"];
    apiErrorHandlers?: undefined;
    useDefaultBadRequestHandler?: undefined;
    badRequestHandlerCallback?: undefined;
}

interface IMutateErrorHandlerUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error>
    extends IBaseMutateUseFormProps<TVariables, TData, TContext, TError> {
    mutate: UseMutateFunction<TData, TError, TVariables, TContext>;
    mutateOnError?: undefined;
    apiErrorHandlers?: IApiErrorHandlerMap;
    useDefaultBadRequestHandler?: bool;
    badRequestHandlerCallback?: (errors?: Record<string, string>, focusElement?: string | HTMLInputElement | null) => void;
}

export type TUseFormProps<TVariables = unknown, TData = unknown, TContext = unknown, TError = Error, TFormData extends bool = false> =
    | IFormDataUseFormProps<TVariables, TData, TContext, TError, TFormData>
    | IFormUseFormProps<TVariables, TData, TContext, TError, TFormData>
    | IMutateErrorCallbackUseFormProps<TVariables, TData, TContext, TError>
    | IMutateErrorHandlerUseFormProps<TVariables, TData, TContext, TError>;

export interface IUseForm<TVariables = unknown, TFormData extends bool = false> {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
    formDataRef: React.MutableRefObject<TFormData extends true ? FormData : TVariables>;
    handleSubmit: (formOrEvent: React.FormEvent<HTMLFormElement> | HTMLFormElement | Record<string, string | File | DataTransfer>) => void;
    formRef: React.MutableRefObject<HTMLFormElement | null>;
    focusElementRef: React.MutableRefObject<HTMLInputElement | string | null>;
}
