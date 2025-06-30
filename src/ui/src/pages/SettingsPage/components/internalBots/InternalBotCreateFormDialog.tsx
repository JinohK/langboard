import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Dialog, Floating, Form, Select, SubmitButton, Toast } from "@/components/base";
import { useMemo, useRef, useState } from "react";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import AvatarUploader from "@/components/AvatarUploader";
import { InternalBotModel } from "@/core/models";
import { isValidURL } from "@/core/utils/StringUtils";
import useCreateInternalBot from "@/controllers/api/settings/internalBots/useCreateInternalBot";
import InternalBotValueInput from "@/pages/SettingsPage/components/internalBots/InternalBotValueInput";
import PasswordInput from "@/components/PasswordInput";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

export interface IInternalBotCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function InternalBotCreateFormDialog({ opened, setOpened }: IInternalBotCreateFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isValidating, setIsValidating] = useState(false);
    const dataTransferRef = useRef(new DataTransfer());
    const inputsRef = useRef({
        displayName: null as HTMLInputElement | null,
        url: null as HTMLInputElement | null,
        apiKey: null as HTMLInputElement | null,
        value: null as HTMLInputElement | HTMLTextAreaElement | null,
    });
    const [selectedType, setSelectedType] = useState<InternalBotModel.EInternalBotType>(InternalBotModel.EInternalBotType.ProjectChat);
    const [selectedPlatform, setSelectedPlatform] = useState<InternalBotModel.EInternalBotPlatform>(InternalBotModel.EInternalBotPlatform.Langflow);
    const [selectedPlatformRunningType, setSelectedPlatformRunningType] = useState<InternalBotModel.EInternalBotPlatformRunningType>(
        InternalBotModel.EInternalBotPlatformRunningType.FlowJson
    );
    const valueType = useMemo(() => {
        switch (selectedPlatformRunningType) {
            case InternalBotModel.EInternalBotPlatformRunningType.FlowJson:
                return "json";
            default:
                return "text";
        }
    }, [selectedPlatformRunningType]);
    const valueRef = useRef<string>("");
    const { mutate } = useCreateInternalBot();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !inputsRef.current.displayName || !inputsRef.current.url || !inputsRef.current.apiKey) {
            return;
        }

        setIsValidating(true);

        const values = {} as Record<keyof typeof inputsRef.current, string>;
        const newErrors = {} as Record<keyof typeof inputsRef.current, string>;
        let focusableInput = null as HTMLInputElement | HTMLTextAreaElement | null;
        Object.entries(inputsRef.current).forEach(([key, input]) => {
            const value = input!.value.trim();
            if (!value) {
                if (key === "apiKey") {
                    return;
                }

                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.missing.internal_bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else if (key === "url" && !isValidURL(value)) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.invalid.internal_bot_${key}`);
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
                bot_type: selectedType,
                display_name: values.displayName,
                platform: selectedPlatform,
                platform_running_type: selectedPlatformRunningType,
                url: values.url,
                api_key: values.apiKey,
                value: valueRef.current,
                avatar: dataTransferRef.current.files[0],
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Internal bot created successfully."));
                    if (dataTransferRef.current.items.length) {
                        dataTransferRef.current.items.clear();
                    }
                    Object.values(inputsRef.current).forEach((input) => {
                        if (input) {
                            input.value = "";
                        }
                    });
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
                    setIsValidating(false);
                    setOpened(false);
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
                    <Dialog.Title>{t("settings.Create internal bot")}</Dialog.Title>
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
                        <Floating.LabelInput
                            label={t("settings.Internal bot display name")}
                            autoFocus
                            autoComplete="off"
                            disabled={isValidating}
                            ref={(el) => {
                                inputsRef.current.displayName = el;
                            }}
                        />
                        {errors.displayName && <FormErrorMessage error={errors.displayName} notInForm />}
                    </Box>
                    <Box mt="4">
                        <Select.Root value={selectedType} onValueChange={setSelectedType as (value: string) => void} disabled={isValidating}>
                            <Select.Trigger>
                                <Select.Value placeholder={t("settings.Select a type")} />
                            </Select.Trigger>
                            <Select.Content>
                                {Object.keys(InternalBotModel.EInternalBotType).map((typeKey) => {
                                    const botType = InternalBotModel.EInternalBotType[typeKey];
                                    return (
                                        <Select.Item value={botType} key={`internal-bot-type-select-${botType}`}>
                                            {t(`internalBot.botTypes.${botType}`)}
                                        </Select.Item>
                                    );
                                })}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box mt="4">
                        <Select.Root value={selectedPlatform} onValueChange={setSelectedPlatform as (value: string) => void} disabled={isValidating}>
                            <Select.Trigger>
                                <Select.Value placeholder={t("settings.Select a platform")} />
                            </Select.Trigger>
                            <Select.Content>
                                {Object.keys(InternalBotModel.EInternalBotPlatform).map((typeKey) => {
                                    const botType = InternalBotModel.EInternalBotPlatform[typeKey];
                                    return (
                                        <Select.Item value={botType} key={`internal-bot-platform-select-${botType}`}>
                                            {t(`internalBot.platforms.${botType}`)}
                                        </Select.Item>
                                    );
                                })}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box mt="4">
                        <Select.Root
                            value={selectedPlatformRunningType}
                            onValueChange={setSelectedPlatformRunningType as (value: string) => void}
                            disabled={isValidating}
                        >
                            <Select.Trigger>
                                <Select.Value placeholder={t("settings.Select a platform running type")} />
                            </Select.Trigger>
                            <Select.Content>
                                {Object.keys(InternalBotModel.EInternalBotPlatformRunningType).map((typeKey) => {
                                    const botType = InternalBotModel.EInternalBotPlatformRunningType[typeKey];
                                    return (
                                        <Select.Item value={botType} key={`internal-bot-platform-running-type-select-${botType}`}>
                                            {t(`internalBot.platformRunningTypes.${botType}`)}
                                        </Select.Item>
                                    );
                                })}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box mt="4">
                        <Floating.LabelInput
                            label={t("settings.Internal bot API URL")}
                            autoComplete="off"
                            disabled={isValidating}
                            ref={(el) => {
                                inputsRef.current.url = el;
                            }}
                        />
                        {errors.url && <FormErrorMessage error={errors.url} notInForm />}
                    </Box>
                    <Box mt="4">
                        <PasswordInput
                            label={t("settings.Internal bot API key")}
                            isValidating={isValidating}
                            autoComplete="off"
                            ref={(el) => {
                                inputsRef.current.apiKey = el;
                            }}
                        />
                        {errors.apiKey && <FormErrorMessage error={errors.apiKey} notInForm />}
                    </Box>
                    <Box mt="4">
                        {selectedPlatformRunningType === InternalBotModel.EInternalBotPlatformRunningType.FlowJson && (
                            <Alert variant="warning" icon="alert-triangle" title={t("common.Warning")} className="mb-2">
                                {t("settings.Flow json is only supported in the internal flows server.")}
                            </Alert>
                        )}
                        <InternalBotValueInput
                            value=""
                            valueType={valueType}
                            newValueRef={valueRef}
                            isValidating={isValidating}
                            previewByDialog
                            ref={(el) => {
                                inputsRef.current.value = el;
                            }}
                        />

                        {errors.value && <FormErrorMessage error={errors.value} notInForm />}
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

export default InternalBotCreateFormDialog;
