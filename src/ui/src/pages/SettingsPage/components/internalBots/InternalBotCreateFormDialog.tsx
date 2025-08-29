/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Dialog, Floating, Form, Select, SubmitButton, Toast } from "@/components/base";
import { useEffect, useMemo, useRef, useState } from "react";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import AvatarUploader from "@/components/AvatarUploader";
import { InternalBotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";
import useCreateInternalBot from "@/controllers/api/settings/internalBots/useCreateInternalBot";
import PasswordInput from "@/components/PasswordInput";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { getValueType, requirements } from "@/components/BotValueInput/utils";
import { AVAILABLE_RUNNING_TYPES_BY_PLATFORM, EBotPlatform, EBotPlatformRunningType } from "@/core/models/bot.related.type";
import BotValueInput from "@/components/BotValueInput";
import { TBotValueDefaultInputRefLike } from "@/components/BotValueInput/types";

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
        value: null as HTMLInputElement | HTMLTextAreaElement | TBotValueDefaultInputRefLike | null,
    });
    const setInputRef = (key: keyof typeof inputsRef.current) => (el: HTMLElement | TBotValueDefaultInputRefLike | null) => {
        inputsRef.current[key] = el as any;
    };
    const [selectedType, setSelectedType] = useState<InternalBotModel.EInternalBotType>(InternalBotModel.EInternalBotType.ProjectChat);
    const [selectedPlatform, setSelectedPlatform] = useState<EBotPlatform>(EBotPlatform.Default);
    const [selectedPlatformRunningType, setSelectedPlatformRunningType] = useState<EBotPlatformRunningType>(EBotPlatformRunningType.Default);
    const valueType = useMemo(() => getValueType(selectedPlatform, selectedPlatformRunningType), [selectedPlatform, selectedPlatformRunningType]);
    const formRequirements = useMemo(
        () => requirements[selectedPlatform]?.[selectedPlatformRunningType] ?? [],
        [selectedPlatform, selectedPlatformRunningType]
    );
    const valueRef = useRef("");
    const { mutate } = useCreateInternalBot();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !inputsRef.current.displayName) {
            return;
        }

        setIsValidating(true);

        const values = {} as Record<keyof typeof inputsRef.current, string>;
        const newErrors = {} as Record<keyof typeof inputsRef.current, string>;
        let focusableInput = null as HTMLInputElement | HTMLTextAreaElement | null;

        const shouldValidateInputs: (keyof typeof inputsRef.current)[] = ["displayName", ...formRequirements];
        shouldValidateInputs.forEach((key) => {
            const input = inputsRef.current[key] as HTMLInputElement | HTMLTextAreaElement;
            if (!input) {
                return;
            }

            if (input?.type === "default-bot-json") {
                return;
            }

            const value = input!.value.trim();
            if (!value) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.missing.internal_bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else if (key === "url" && !Utils.String.isValidURL(value)) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.invalid.internal_bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else {
                values[key] = value;
            }
        });

        let shouldStop = false;
        const valueInput = inputsRef.current.value;
        if (shouldValidateInputs.includes("value") && valueInput?.type === "default-bot-json") {
            const validated = (valueInput as TBotValueDefaultInputRefLike).validate(!focusableInput);
            if (!validated) {
                shouldStop = true;
            }
        }

        if (Object.keys(newErrors).length || shouldStop) {
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

    useEffect(() => {
        if (AVAILABLE_RUNNING_TYPES_BY_PLATFORM[selectedPlatform].includes(selectedPlatformRunningType)) {
            return;
        }

        setSelectedPlatformRunningType(AVAILABLE_RUNNING_TYPES_BY_PLATFORM[selectedPlatform][0]);
    }, [selectedPlatform]);

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
                            required
                            ref={setInputRef("displayName")}
                        />
                        {errors.displayName && <FormErrorMessage error={errors.displayName} notInForm />}
                    </Box>
                    <Box mt="4">
                        <Floating.LabelSelect
                            label={t("settings.Select a type")}
                            value={selectedType}
                            onValueChange={setSelectedType as (value: string) => void}
                            disabled={isValidating}
                            required
                            options={Object.keys(InternalBotModel.EInternalBotType).map((typeKey) => {
                                const botType = InternalBotModel.EInternalBotType[typeKey];
                                return (
                                    <Select.Item value={botType} key={`internal-bot-type-select-${botType}`}>
                                        {t(`internalBot.botTypes.${botType}`)}
                                    </Select.Item>
                                );
                            })}
                        />
                    </Box>
                    <Box mt="4">
                        <Floating.LabelSelect
                            label={t("settings.Select a platform")}
                            value={selectedPlatform}
                            onValueChange={setSelectedPlatform as (value: string) => void}
                            disabled={isValidating}
                            required
                            options={Object.keys(EBotPlatform).map((typeKey) => {
                                const botType = EBotPlatform[typeKey];
                                return (
                                    <Select.Item value={botType} key={`internal-bot-platform-select-${botType}`}>
                                        {t(`bot.platforms.${botType}`)}
                                    </Select.Item>
                                );
                            })}
                        />
                    </Box>
                    <Box mt="4">
                        <Floating.LabelSelect
                            label={t("settings.Select a platform running type")}
                            value={selectedPlatformRunningType}
                            onValueChange={setSelectedPlatformRunningType as (value: string) => void}
                            disabled={isValidating}
                            required
                            options={AVAILABLE_RUNNING_TYPES_BY_PLATFORM[selectedPlatform].map((botType) => {
                                return (
                                    <Select.Item value={botType} key={`internal-bot-platform-running-type-select-${botType}`}>
                                        {t(`bot.platformRunningTypes.${botType}`)}
                                    </Select.Item>
                                );
                            })}
                        />
                    </Box>
                    {formRequirements.includes("url") && (
                        <Box mt="4">
                            <Floating.LabelInput
                                label={t("settings.Internal bot API URL")}
                                autoComplete="off"
                                disabled={isValidating}
                                required
                                ref={setInputRef("url")}
                            />
                            {errors.url && <FormErrorMessage error={errors.url} notInForm />}
                        </Box>
                    )}
                    {formRequirements.includes("apiKey") && (
                        <Box mt="4">
                            <PasswordInput
                                label={t("settings.Internal bot API key")}
                                isValidating={isValidating}
                                autoComplete="off"
                                required
                                ref={setInputRef("apiKey")}
                            />
                            {errors.apiKey && <FormErrorMessage error={errors.apiKey} notInForm />}
                        </Box>
                    )}
                    {formRequirements.includes("value") && (
                        <Box mt="4">
                            {selectedPlatformRunningType === EBotPlatformRunningType.FlowJson && (
                                <Alert variant="warning" icon="alert-triangle" title={t("common.Warning")} className="mb-2">
                                    {t("settings.The internal flows server should be running to use.")}
                                </Alert>
                            )}
                            <BotValueInput
                                value=""
                                label={t(`bot.platformRunningTypes.${selectedPlatformRunningType}`)}
                                valueType={valueType}
                                newValueRef={valueRef}
                                isValidating={isValidating}
                                previewByDialog
                                required
                                ref={setInputRef("value")}
                            />

                            {errors.value && <FormErrorMessage error={errors.value} notInForm />}
                        </Box>
                    )}
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
