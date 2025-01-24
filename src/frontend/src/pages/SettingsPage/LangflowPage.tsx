import { Box, Flex, Floating, SubmitButton, Toast } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import PasswordInput from "@/components/PasswordInput";
import useUpdateSetting from "@/controllers/api/settings/useUpdateSetting";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function LangflowPage() {
    const [t] = useTranslation();
    const { navigate, isValidating, setIsValidating } = useAppSetting();
    const langflowUrl = AppSettingModel.Model.getModel((model) => model.setting_type === ESettingType.LangflowUrl)!;
    const langflowApiKey = AppSettingModel.Model.getModel((model) => model.setting_type === ESettingType.LangflowApiKey)!;
    const urlValue = langflowUrl.useField("setting_value");
    const apiKeyValue = langflowApiKey.useField("setting_value");
    const urlInputRef = useRef<HTMLInputElement>(null);
    const apiKeyInputRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { mutateAsync: updateUrlSettingMutateAsync } = useUpdateSetting(langflowUrl);
    const { mutateAsync: updateApiKeySettingMutateAsync } = useUpdateSetting(langflowApiKey);

    const save = () => {
        if (isValidating || !urlInputRef.current || !apiKeyInputRef.current) {
            return;
        }

        setIsValidating(true);

        const newUrlValue = urlInputRef.current.value.trim();
        const newApiKeyValue = apiKeyInputRef.current.value.trim();
        const newErrors: Record<string, string> = {};
        let focusableInput: HTMLInputElement | null = null;

        if (!newUrlValue.startsWith("http://") && !newUrlValue.startsWith("https://")) {
            newErrors.url = t("settings.errors.invalid.langflow_url");
            focusableInput = urlInputRef.current;
        }

        if (!newUrlValue.length && newApiKeyValue.length) {
            newErrors.url = t("settings.errors.missing.langflow_url");
            if (!focusableInput) {
                focusableInput = urlInputRef.current;
            }
        }

        if (newUrlValue.length && !newApiKeyValue.length) {
            newErrors.apiKey = t("settings.errors.missing.langflow_api_key");
            if (!focusableInput) {
                focusableInput = apiKeyInputRef.current;
            }
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setIsValidating(false);
            focusableInput?.focus();
            return;
        }

        if (urlValue === newUrlValue && apiKeyValue === newApiKeyValue) {
            setIsValidating(false);
            return;
        }

        const promises: Promise<unknown>[] = [];
        if (urlValue !== newUrlValue) {
            promises.push(updateUrlSettingMutateAsync({ setting_value: newUrlValue }));
        }
        if (apiKeyValue !== newApiKeyValue) {
            promises.push(updateApiKeySettingMutateAsync({ setting_value: newApiKeyValue }));
        }

        Toast.Add.promise(Promise.all(promises), {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                        navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                langflowUrl.setting_value = newUrlValue;
                langflowApiKey.setting_value = newApiKeyValue;
                return t("settings.successes.API key name changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("settings.Langflow")}</h2>
            <Flex justify="center" mt="12">
                <Box w="full" className="max-w-md">
                    <Box>
                        <Floating.LabelInput
                            label={t("settings.Langflow URL")}
                            autoFocus
                            defaultValue={urlValue}
                            disabled={isValidating}
                            ref={urlInputRef}
                        />
                        {errors.url && <FormErrorMessage error={errors.url} notInForm />}
                    </Box>
                    <Box>
                        <PasswordInput
                            name=""
                            className="mt-4"
                            label={t("settings.Langflow API key")}
                            defaultValue={apiKeyValue}
                            isValidating={isValidating}
                            ref={apiKeyInputRef}
                        />
                        {errors.apiKey && <FormErrorMessage error={errors.apiKey} notInForm />}
                    </Box>
                </Box>
            </Flex>
            <Flex items="center" justify="center" mt="12">
                <SubmitButton type="button" isValidating={isValidating} onClick={save}>
                    {t("common.Save")}
                </SubmitButton>
            </Flex>
        </>
    );
}

export default LangflowPage;
