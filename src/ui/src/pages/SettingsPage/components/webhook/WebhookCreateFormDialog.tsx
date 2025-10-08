import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, SubmitButton, Toast } from "@/components/base";
import { useRef, useState } from "react";
import useCreateSetting from "@/controllers/api/settings/useCreateSetting";
import { ESettingType } from "@/core/models/AppSettingModel";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

export interface IWebhookCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function WebhookCreateFormDialog({ opened, setOpened }: IWebhookCreateFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isValidating, setIsValidating] = useState(false);
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

        if (!Utils.String.isValidURL(urlValue)) {
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
                onSuccess: () => {
                    Toast.Add.success(t("successes.Webhook created successfully."));
                    setTimeout(() => {
                        setOpened(false);
                    }, 0);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
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
                },
            }
        );
    };

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        setOpened(opened);
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create webhook")}</Dialog.Title>
                </Dialog.Header>
                <Box mt="4">
                    <Floating.LabelInput
                        label={t("settings.Webhook name")}
                        autoFocus
                        autoComplete="off"
                        disabled={isValidating}
                        required
                        ref={nameInputRef}
                    />
                    {errors.name && <FormErrorMessage error={errors.name} notInForm />}
                </Box>
                <Box mt="4">
                    <Floating.LabelInput label={t("settings.Webhook URL")} autoComplete="off" disabled={isValidating} required ref={urlInputRef} />
                    {errors.url && <FormErrorMessage error={errors.url} notInForm />}
                </Box>
                <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                    <Dialog.Close asChild>
                        <Button type="button" variant="secondary" disabled={isValidating}>
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
