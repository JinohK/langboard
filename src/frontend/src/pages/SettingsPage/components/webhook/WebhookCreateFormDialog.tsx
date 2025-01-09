import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, SubmitButton, Toast } from "@/components/base";
import { useEffect, useRef, useState } from "react";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import useCreateSetting from "@/controllers/api/settings/useCreateSetting";
import { ESettingType } from "@/core/models/AppSettingModel";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";

export interface IWebhookCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function WebhookCreateFormDialog({ opened, setOpened }: IWebhookCreateFormDialogProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { navigate, isValidating, setIsValidating } = useAppSetting();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const { mutate } = useCreateSetting();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !nameInputRef.current || !urlInputRef.current) {
            return;
        }

        setIsValidating(true);

        const nameValue = nameInputRef.current.value.trim();
        const urlValue = urlInputRef.current.value.trim();
        const newErrors: Record<string, string> = {};
        let focusableInput: HTMLInputElement | null = null;

        if (!nameValue) {
            newErrors.name = t("settings.errors.missing.webhook_url");
            focusableInput = nameInputRef.current;
        }

        if (!urlValue.startsWith("http://") && !urlValue.startsWith("https://")) {
            newErrors.url = t("settings.errors.invalid.webhook_url");
            if (!focusableInput) {
                focusableInput = urlInputRef.current;
            }
        }

        if (!urlValue) {
            newErrors.url = t("settings.errors.missing.webhook_url");
            if (!focusableInput) {
                focusableInput = urlInputRef.current;
            }
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setIsValidating(false);
            focusableInput?.focus();
            return;
        }

        mutate(
            {
                setting_type: ESettingType.WebhookUrl,
                setting_name: nameValue,
                setting_value: urlValue,
            },
            {
                onSuccess: (data) => {
                    data.createToast(t("settings.successes.Webhook created successfully."));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    if (nameInputRef.current) {
                        nameInputRef.current.value = "";
                    }
                    if (urlInputRef.current) {
                        urlInputRef.current.value = "";
                    }
                    setIsValidating(false);
                    setOpened(false);
                },
            }
        );
    };

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create webhook")}</Dialog.Title>
                </Dialog.Header>
                <Box>
                    <Floating.LabelInput
                        label={t("settings.Webhook name")}
                        autoFocus
                        autoComplete="off"
                        className="mt-4"
                        disabled={isValidating}
                        ref={nameInputRef}
                    />
                    {errors.name && <FormErrorMessage error={errors.name} notInForm />}
                </Box>
                <Box>
                    <Floating.LabelInput
                        label={t("settings.Webhook URL")}
                        autoComplete="off"
                        className="mt-4"
                        disabled={isValidating}
                        ref={urlInputRef}
                    />
                    {errors.url && <FormErrorMessage error={errors.url} notInForm />}
                </Box>
                <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                    <Dialog.Close asChild>
                        <Button type="button" variant="destructive" disabled={isValidating}>
                            {t("common.Cancel")}
                        </Button>
                    </Dialog.Close>
                    <SubmitButton type="button" isValidating={isValidating} onClick={save}>
                        {t("common.Create")}
                    </SubmitButton>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default WebhookCreateFormDialog;
