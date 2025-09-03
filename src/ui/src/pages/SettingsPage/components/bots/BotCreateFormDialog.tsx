/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Checkbox, Dialog, Flex, Floating, Form, Label, Select, SubmitButton, Toast } from "@/components/base";
import { useMemo, useRef, useState } from "react";
import useCreateBot from "@/controllers/api/settings/bots/useCreateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import AvatarUploader from "@/components/AvatarUploader";
import { BotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";
import CopyInput from "@/components/CopyInput";
import MultiSelect from "@/components/MultiSelect";
import PasswordInput from "@/components/PasswordInput";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import {
    ALLOWED_ALL_IPS_BY_PLATFORMS,
    AVAILABLE_RUNNING_TYPES_BY_PLATFORM,
    EBotPlatform,
    EBotPlatformRunningType,
} from "@/core/models/bot.related.type";
import { getValueType, requirements } from "@/components/BotValueInput/utils";
import { TBotValueDefaultInputRefLike } from "@/components/BotValueInput/types";
import BotValueInput from "@/components/BotValueInput";

export interface IBotCreateFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function BotCreateFormDialog({ opened, setOpened }: IBotCreateFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isValidating, setIsValidating] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string>();
    const dataTransferRef = useRef(new DataTransfer());
    const inputsRef = useRef({
        name: null as HTMLInputElement | null,
        uname: null as HTMLInputElement | null,
        url: null as HTMLInputElement | null,
        apiKey: null as HTMLInputElement | null,
        value: null as HTMLInputElement | HTMLTextAreaElement | TBotValueDefaultInputRefLike | null,
    });
    const setInputRef = (key: keyof typeof inputsRef.current) => (el: HTMLElement | TBotValueDefaultInputRefLike | null) => {
        inputsRef.current[key] = el as any;
    };
    const [selectedPlatform, setSelectedPlatform] = useState<EBotPlatform>(EBotPlatform.Default);
    const [selectedPlatformRunningType, setSelectedPlatformRunningType] = useState<EBotPlatformRunningType>(EBotPlatformRunningType.Default);
    const formRequirements = useMemo(
        () => requirements[selectedPlatform]?.[selectedPlatformRunningType] ?? [],
        [selectedPlatform, selectedPlatformRunningType]
    );
    const valueType = useMemo(() => getValueType(selectedPlatform, selectedPlatformRunningType), [selectedPlatform, selectedPlatformRunningType]);
    const valueRef = useRef("");
    const [isAllAllowedIP, setIsAllAllowedIP] = useState(false);
    const { mutate } = useCreateBot();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const ipWhitelistRef = useRef<string[]>([]);
    const save = () => {
        if (isValidating || !inputsRef.current.name || !inputsRef.current.uname) {
            return;
        }

        setIsValidating(true);

        const values = {} as Record<keyof typeof inputsRef.current, string>;
        const newErrors = {} as Record<keyof typeof inputsRef.current, string>;
        let focusableInput = null as HTMLInputElement | HTMLTextAreaElement | null;

        const shouldValidateInputs: (keyof typeof inputsRef.current)[] = ["name", "uname", ...formRequirements];
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
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.missing.bot_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else if (key === "url" && !Utils.String.isValidURL(value)) {
                newErrors[key as keyof typeof inputsRef.current] = t(`settings.errors.invalid.bot_${key}`);
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
                avatar: dataTransferRef.current.files[0],
                bot_name: values.name,
                bot_uname: values.uname,
                platform: selectedPlatform,
                platform_running_type: selectedPlatformRunningType,
                api_url: values.url,
                api_key: values.apiKey,
                value: valueRef.current,
                ip_whitelist: ipWhitelistRef.current,
            },
            {
                onSuccess: (data) => {
                    Toast.Add.success(t("successes.Bot created successfully."));
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
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: {
                            after: (message) => {
                                newErrors.uname = message as string;
                                setErrors(newErrors);
                                inputsRef.current.uname?.focus();
                            },
                            toast: false,
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

        setRevealedToken(undefined);
        setOpened(opened);
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
                                required
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
                                ref={setInputRef("name")}
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
                                    required
                                    disabled={isValidating}
                                    ref={setInputRef("uname")}
                                />
                            </Box>
                            {errors.uname && <FormErrorMessage error={errors.uname} notInForm />}
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
                                        <Select.Item value={botType} key={`bot-platform-select-${botType}`}>
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
                                        <Select.Item value={botType} key={`bot-platform-running-type-select-${botType}`}>
                                            {t(`bot.platformRunningTypes.${botType}`)}
                                        </Select.Item>
                                    );
                                })}
                            />
                        </Box>
                        {formRequirements.includes("url") && (
                            <Box mt="4">
                                <Floating.LabelInput
                                    label={t("settings.Bot API URL")}
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
                                    label={t("settings.Bot API key")}
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
                        {ALLOWED_ALL_IPS_BY_PLATFORMS[selectedPlatform].includes(selectedPlatformRunningType) && (
                            <Flex mt="4" items="center" gap="2">
                                <MultiSelect
                                    selections={[]}
                                    placeholder={t("settings.Add a new IP address or range (e.g. 192.0.0.1 or 192.0.0.0/24)...")}
                                    selectedValue={[]}
                                    onValueChange={(values) => {
                                        ipWhitelistRef.current = values;
                                    }}
                                    className="w-[calc(100%_-_theme(spacing.24))]"
                                    inputClassName="ml-1 placeholder:text-gray-500 placeholder:font-medium"
                                    canCreateNew
                                    validateCreatedNewValue={Utils.String.isValidIpv4OrRnage}
                                    createNewCommandItemLabel={(value) => {
                                        const newIPs: string[] = [];

                                        if (value.includes("/24")) {
                                            newIPs.push(value, value.replace("/24", ""));
                                        } else {
                                            newIPs.push(value, `${value}/24`);
                                        }

                                        return newIPs.map((ip) => ({
                                            label: ip,
                                            value: ip,
                                        }));
                                    }}
                                    isNewCommandItemMultiple
                                    disabled={isValidating || isAllAllowedIP}
                                />
                                <Label display="flex" items="center" gap="1.5" w="20" mb="2" cursor="pointer">
                                    <Checkbox
                                        onCheckedChange={(checked) => {
                                            if (Utils.Type.isString(checked)) {
                                                return;
                                            }

                                            if (checked) {
                                                ipWhitelistRef.current = [BotModel.ALLOWED_ALL_IPS];
                                            } else {
                                                ipWhitelistRef.current = [];
                                            }

                                            setIsAllAllowedIP(checked);
                                        }}
                                    />
                                    {t("settings.Allow all")}
                                </Label>
                            </Flex>
                        )}
                    </Form.Root>
                )}
                {revealedToken && <CopyInput value={revealedToken} className="mt-4" />}
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
