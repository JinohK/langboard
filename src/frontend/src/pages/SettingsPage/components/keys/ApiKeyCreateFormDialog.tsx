import { useTranslation } from "react-i18next";
import { Button, Dialog, Floating, SubmitButton, Toast } from "@/components/base";
import { useRef, useState } from "react";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import useCreateSetting from "@/controllers/api/settings/useCreateSetting";
import { ESettingType } from "@/core/models/AppSettingModel";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import CopyInput from "@/components/CopyInput";

export interface IApiKeyCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function ApiKeyCreateFormDialog({ opened, setOpened }: IApiKeyCreateFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const { navigateRef } = useAppSetting();
    const [isValidating, setIsValidating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [revealedKey, setRevealedKey] = useState<string>();
    const { mutate } = useCreateSetting();
    const save = () => {
        if (isValidating || !inputRef.current) {
            return;
        }

        setIsValidating(true);

        const value = inputRef.current.value.trim();
        if (!value) {
            setIsValidating(false);
            inputRef.current.focus();
            return;
        }

        mutate(
            {
                setting_type: ESettingType.ApiKey,
                setting_name: value,
                setting_value: "",
            },
            {
                onSuccess: (data) => {
                    Toast.Add.success(t("settings.successes.API key created successfully."));
                    setRevealedKey(data.revealed_value);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setRevealedKey(undefined);
        }

        setOpened(opened);
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create API key")}</Dialog.Title>
                </Dialog.Header>
                {!revealedKey && (
                    <Floating.LabelInput
                        label={t("settings.API key name")}
                        autoFocus
                        autoComplete="off"
                        className="mt-4"
                        disabled={isValidating}
                        ref={inputRef}
                    />
                )}
                {revealedKey && <CopyInput value={revealedKey} className="mt-4" />}
                <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                    <Dialog.Close asChild>
                        <Button type="button" variant={!revealedKey ? "destructive" : "outline"} disabled={isValidating}>
                            {t(!revealedKey ? "common.Cancel" : "common.Close")}
                        </Button>
                    </Dialog.Close>
                    {!revealedKey && (
                        <SubmitButton type="button" isValidating={isValidating} onClick={save}>
                            {t("common.Create")}
                        </SubmitButton>
                    )}
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default ApiKeyCreateFormDialog;
