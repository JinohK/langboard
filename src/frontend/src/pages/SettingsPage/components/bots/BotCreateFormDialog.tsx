import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, Form, IconComponent, Input, Select, SubmitButton, Toast } from "@/components/base";
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
import { isValidURL } from "@/core/utils/StringUtils";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";

export interface IBotCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function BotCreateFormDialog({ opened, setOpened }: IBotCreateFormDialogProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const [isValidating, setIsValidating] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string>();
    const [isCopied, setIsCopied] = useState(false);
    const dataTransferRef = useRef(new DataTransfer());
    const inputsRef = useRef({
        name: null as HTMLInputElement | null,
        uname: null as HTMLInputElement | null,
        apiURL: null as HTMLInputElement | null,
        apiKey: null as HTMLInputElement | null,
    });
    const [selectedAPIAuthType, setSelectedAPIAuthType] = useState<BotModel.EAPIAuthType>(BotModel.EAPIAuthType.Basic);
    const { mutate } = useCreateBot();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !inputsRef.current.name || !inputsRef.current.uname || !inputsRef.current.apiURL || !inputsRef.current.apiKey) {
            return;
        }

        setIsValidating(true);

        const values = {} as Record<keyof typeof inputsRef.current, string>;
        const newErrors = {} as Record<keyof typeof inputsRef.current, string>;
        let focusableInput = null as HTMLInputElement | null;
        Object.entries(inputsRef.current).forEach(([key, input]) => {
            const value = input!.value.trim();
            if (!value) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.missing.bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else if (key === "apiURL" && !isValidURL(value)) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.invalid.bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else {
                values[key] = value;
            }
        });

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setIsValidating(false);
            focusableInput?.focus();
            return;
        }

        mutate(
            {
                avatar: dataTransferRef.current.files[0],
                bot_name: values.name,
                bot_uname: values.uname,
                api_url: values.apiURL,
                api_auth_type: selectedAPIAuthType,
                api_key: values.apiKey,
            },
            {
                onSuccess: (data) => {
                    Toast.Add.success(t("settings.successes.Bot created successfully."));
                    if (dataTransferRef.current.items.length) {
                        dataTransferRef.current.items.clear();
                    }
                    Object.values(inputsRef.current).forEach((input) => {
                        if (input) {
                            input.value = "";
                        }
                    });
                    setRevealedToken(data.revealed_app_api_token);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            newErrors.uname = t("settings.errors.Bot unique name already exists.");
                            setErrors(newErrors);
                            inputsRef.current.uname?.focus();
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

        setRevealedToken(undefined);
        setOpened(opened);
    };

    const copyToken = (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if (!revealedToken) {
            return;
        }

        selectAllText(e.currentTarget);
        copyToClipboard(revealedToken);
        setIsCopied(true);
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create bot")}</Dialog.Title>
                </Dialog.Header>
                {!revealedToken && (
                    <Form.Root className="mt-4">
                        <AvatarUploader
                            isBot
                            dataTransferRef={dataTransferRef}
                            isValidating={isValidating}
                            errorMessage={errors.avatar}
                            avatarSize="3xl"
                        />
                        <Box mt="10">
                            <Floating.LabelInput
                                label={t("settings.Bot name")}
                                autoFocus
                                autoComplete="off"
                                disabled={isValidating}
                                onInput={(e) => {
                                    const replacableValue = e.currentTarget.value.replace(/\s+/g, "-").toLowerCase();
                                    if (
                                        inputsRef.current.uname &&
                                        (inputsRef.current.uname.value === replacableValue.slice(0, inputsRef.current.uname.value.length) ||
                                            inputsRef.current.uname.value.slice(0, replacableValue.length) === replacableValue)
                                    ) {
                                        inputsRef.current.uname.value = replacableValue;
                                    }
                                }}
                                ref={(el) => {
                                    inputsRef.current.name = el;
                                }}
                            />
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
                                    ref={(el) => {
                                        inputsRef.current.uname = el;
                                    }}
                                />
                            </Box>
                            {errors.uname && <FormErrorMessage error={errors.uname} notInForm />}
                        </Box>
                        <Box mt="4">
                            <Floating.LabelInput
                                label={t("settings.Bot API URL")}
                                autoComplete="off"
                                disabled={isValidating}
                                ref={(el) => {
                                    inputsRef.current.apiURL = el;
                                }}
                            />
                            {errors.apiURL && <FormErrorMessage error={errors.apiURL} notInForm />}
                        </Box>
                        <Box mt="4">
                            <Select.Root
                                value={selectedAPIAuthType}
                                onValueChange={(value) => setSelectedAPIAuthType(value as BotModel.EAPIAuthType)}
                                disabled={isValidating}
                            >
                                <Select.Trigger>
                                    <Select.Value placeholder={t("settings.Select an api auth type")} />
                                </Select.Trigger>
                                <Select.Content>
                                    {Object.keys(BotModel.EAPIAuthType).map((authTypeKey) => {
                                        const authType = BotModel.EAPIAuthType[authTypeKey];
                                        return (
                                            <Select.Item value={authType} key={`bot-auth-type-select-${authType}`}>
                                                {t(`settings.authTypes.${authType}`)}
                                            </Select.Item>
                                        );
                                    })}
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box mt="4">
                            <Floating.LabelInput
                                label={t("settings.Bot API key")}
                                autoComplete="off"
                                disabled={isValidating}
                                ref={(el) => {
                                    inputsRef.current.apiKey = el;
                                }}
                            />
                            {errors.apiKey && <FormErrorMessage error={errors.apiKey} notInForm />}
                        </Box>
                    </Form.Root>
                )}
                {revealedToken && (
                    <Box position="relative" mt="4">
                        <Input
                            value={revealedToken}
                            onFocus={copyToken}
                            onClick={copyToken}
                            readOnly
                            className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""}
                        />
                        {isCopied && <IconComponent icon="check" size="5" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                    </Box>
                )}
                <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                    <Dialog.Close asChild>
                        <Button type="button" variant={!revealedToken ? "destructive" : "outline"} disabled={isValidating}>
                            {t(!revealedToken ? "common.Cancel" : "common.Close")}
                        </Button>
                    </Dialog.Close>
                    {!revealedToken && (
                        <SubmitButton type="button" isValidating={isValidating} onClick={save}>
                            {t("common.Create")}
                        </SubmitButton>
                    )}
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BotCreateFormDialog;
