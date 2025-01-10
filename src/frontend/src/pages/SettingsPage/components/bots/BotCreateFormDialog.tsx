import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, Form, SubmitButton, Toast } from "@/components/base";
import { useEffect, useRef, useState } from "react";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import useCreateBot from "@/controllers/api/settings/bots/useCreateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import AvatarUploader from "@/components/AvatarUploader";
import { BotModel } from "@/core/models";

export interface IBotCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function BotCreateFormDialog({ opened, setOpened }: IBotCreateFormDialogProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const [isValidating, setIsValidating] = useState(false);
    const dataTransferRef = useRef(new DataTransfer());
    const nameInputRef = useRef<HTMLInputElement>(null);
    const botUNameInputRef = useRef<HTMLInputElement>(null);
    const { mutate } = useCreateBot();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !nameInputRef.current || !botUNameInputRef.current) {
            return;
        }

        setIsValidating(true);

        const nameValue = nameInputRef.current.value.trim();
        const botUNameValue = botUNameInputRef.current.value.trim();
        const newErrors: Record<string, string> = {};
        let focusableInput: HTMLInputElement | null = null;

        if (!nameValue) {
            newErrors.name = t("settings.errors.missing.bot_name");
            focusableInput = nameInputRef.current;
        }

        if (!botUNameValue) {
            newErrors.botUName = t("settings.errors.missing.bot_uname");
            if (!focusableInput) {
                focusableInput = botUNameInputRef.current;
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
                avatar: dataTransferRef.current.files[0],
                bot_name: nameValue,
                bot_uname: botUNameValue,
            },
            {
                onSuccess: (data) => {
                    data.createToast(t("settings.successes.Bot created successfully."));
                    if (dataTransferRef.current.items.length) {
                        dataTransferRef.current.items.clear();
                    }
                    if (nameInputRef.current) {
                        nameInputRef.current.value = "";
                    }
                    if (botUNameInputRef.current) {
                        botUNameInputRef.current.value = "";
                    }
                    setTimeout(() => {
                        setOpened(false);
                    }, 0);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            newErrors.botUName = t("settings.errors.Bot unique name already exists.");
                            setErrors(newErrors);
                            botUNameInputRef.current!.focus();
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

        setOpened(opened);
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create bot")}</Dialog.Title>
                </Dialog.Header>
                <Form.Root className="mt-4">
                    <AvatarUploader
                        isBot
                        dataTransferRef={dataTransferRef}
                        isValidating={isValidating}
                        errorMessage={errors.avatar}
                        avatarSize="3xl"
                    />
                    <Box mt="10">
                        <Floating.LabelInput label={t("settings.Bot name")} autoFocus autoComplete="off" disabled={isValidating} ref={nameInputRef} />
                        {errors.name && <FormErrorMessage error={errors.name} notInForm />}
                    </Box>
                    <Box mt="4">
                        <Box position="relative" className="[&_label]:pl-10">
                            <Box position="absolute" left="3" z="50" textSize="sm" className="top-1/2 -translate-y-1/2">
                                {BotModel.Model.BOT_UNAME_PREFIX}
                            </Box>
                            <Floating.LabelInput
                                label={t("settings.Bot Unique Name")}
                                autoComplete="off"
                                className="pl-10"
                                disabled={isValidating}
                                ref={botUNameInputRef}
                            />
                        </Box>
                        {errors.botUName && <FormErrorMessage error={errors.botUName} notInForm />}
                    </Box>
                </Form.Root>
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

export default BotCreateFormDialog;
