import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, IconComponent, Input, SubmitButton, Toast } from "@/components/base";
import { useEffect, useRef, useState } from "react";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import useCreateSetting from "@/controllers/api/settings/useCreateSetting";
import { ESettingType } from "@/core/models/AppSettingModel";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";

export interface IApiKeyCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function ApiKeyCreateFormDialog({ opened, setOpened }: IApiKeyCreateFormDialogProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const [isValidating, setIsValidating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [revealedKey, setRevealedKey] = useState<string>();
    const [isCopied, setIsCopied] = useState(false);
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
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
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

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setRevealedKey(undefined);
            setIsCopied(false);
        }

        setOpened(opened);
    };

    const copyKey = (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if (!revealedKey) {
            return;
        }

        selectAllText(e.currentTarget);
        copyToClipboard(revealedKey);
        setIsCopied(true);
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
                {revealedKey && (
                    <Box position="relative" mt="4">
                        <Input
                            value={revealedKey}
                            onFocus={copyKey}
                            onClick={copyKey}
                            readOnly
                            className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""}
                        />
                        {isCopied && <IconComponent icon="check" size="5" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                    </Box>
                )}
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
