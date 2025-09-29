/* eslint-disable @typescript-eslint/no-explicit-any */
import { Utils } from "@langboard/core/utils";
import { useEffect, useRef, useState } from "react";
import { Agent, TAgentFormInput, TAgentModelName } from "@langboard/core/ai";
import { Box, Flex, Floating, IconComponent, Select, SubmitButton, Tooltip } from "@/components/base";
import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { TSharedBotValueInputProps } from "@/components/bots/BotValueInput/types";
import useGetApiList from "@/controllers/api/settings/schemas/useGetApiList";
import MultiSelect from "@/components/MultiSelect";
import { BotValueDefaultInputProvider } from "@/components/bots/BotValueInput/DefaultProvider";
import DefaultTypedInput from "@/components/bots/BotValueInput/DefaultTypedInput";
import { providerIconMap } from "@/components/bots/BotValueInput/utils";
import { API_URL, IS_OLLAMA_RUNNING } from "@/constants";

function BotValueDefaultInput({ value, newValueRef, isValidating, required, change, ref }: TSharedBotValueInputProps) {
    const [t] = useTranslation();
    const valuesRef = useRef<Record<string, any>>(Utils.String.isJsonString(value) ? JSON.parse(value) : {});
    const { mutateAsync: getApiListMutateAsync } = useGetApiList({ interceptToast: true });
    const [selectedProvider, setSelectedProvider] = useState<TAgentModelName>((valuesRef.current["agent_llm"] as TAgentModelName) ?? "OpenAI");
    const [selectedApis, setSelectedApis] = useState<string[]>((valuesRef.current["api_names"] as string[]) ?? []);
    const [inputs, setInputs] = useState<TAgentFormInput[]>([]);
    const inputsRef = useRef<Record<string, HTMLElement | null>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const setInputRef = (name: string) => (element: HTMLElement | null) => {
        inputsRef.current[name] = element;
    };
    const setValue = (name: string) => (value: any) => {
        valuesRef.current[name] = value;
        newValueRef.current = JSON.stringify(valuesRef.current);
    };
    const [apiList, setApiList] = useState<Record<string, string>>({});
    const getRef = () => ({
        type: "default-bot-json" as const,
        value: newValueRef.current,
        validate: (shouldFocus?: bool) => {
            if (!required) {
                return true;
            }

            let focusable: HTMLElement | null = null;
            const newErrors: Record<string, string> = {};

            if (!valuesRef.current["agent_llm"]) {
                newErrors["agent_llm"] = t("bot.agent.errors.missing.agent_llm");
                if (!focusable) {
                    focusable = inputsRef.current.agent_llm;
                }
            }

            inputs.forEach((input) => {
                const value = valuesRef.current[input.name];
                if (!value) {
                    newErrors[input.name] = t(`bot.agent.errors.missing.${input.name}`);
                    if (!focusable) {
                        focusable = inputsRef.current[input.name];
                    }
                }
            });

            if (focusable) {
                setErrors(() => newErrors);
                if (shouldFocus) {
                    focusable?.focus();
                }
                return false;
            }

            return true;
        },
    });

    if (Utils.Type.isFunction(ref)) {
        ref(getRef());
    } else if (ref) {
        ref.current = getRef();
    }

    useEffect(() => {
        for (let i = 0; i < inputs.length; ++i) {
            const input = inputs[i];

            if (input.type === "select") {
                delete valuesRef.current[input.name];
            }
        }

        setValue("agent_llm")(selectedProvider);
        setInputs(Agent.getInputForm(selectedProvider, { IS_OLLAMA_RUNNING, API_URL }));
    }, [selectedProvider]);

    useEffect(() => {
        setValue("api_names")(selectedApis);
    }, [selectedApis]);

    useEffect(() => {
        const getApiList = async () => {
            const data = await getApiListMutateAsync({});
            setApiList(data || {});
        };
        getApiList();
    }, []);

    return (
        <BotValueDefaultInputProvider
            selectedProvider={selectedProvider}
            valuesRef={valuesRef}
            setValue={setValue}
            setInputRef={setInputRef}
            required={required}
            isValidating={isValidating}
        >
            <Box border rounded px="3" pt="5" pb="4" position="relative">
                <Box position="absolute" className="start-2 top-2.5 z-10 origin-[0] -translate-y-6 bg-background px-2">
                    {t("bot.agent.Agent settings")}
                </Box>
                <Box>
                    <MultiSelect
                        placeholder={t("bot.agent.Select API(s) to use")}
                        selections={Object.keys(apiList).map((value) => ({ label: value, value }))}
                        selectedValue={selectedApis}
                        listClassName="absolute w-[calc(100%_-_theme(spacing.6))]"
                        badgeListClassName="max-h-28 overflow-y-auto relative"
                        inputClassName="sticky bottom-0 bg-background ml-0 pl-2"
                        onValueChange={setSelectedApis}
                        createBadgeWrapper={(badge, value) => (
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
                                <Tooltip.Content className="max-w-[min(95vw,theme(spacing.96))]">{apiList[value]}</Tooltip.Content>
                            </Tooltip.Root>
                        )}
                        disabled={isValidating}
                    />
                </Box>
                <Box mt="4">
                    <Floating.LabelSelect
                        label={t("bot.agent.Select a provider")}
                        value={selectedProvider}
                        onValueChange={setSelectedProvider as (value: TAgentModelName) => void}
                        required={required}
                        disabled={isValidating}
                        options={Agent.AGENT_MODELS.map((option) => (
                            <Select.Item key={`default-bot-json-input-agent-${option}`} value={option}>
                                <Flex items="center" gap="2">
                                    <IconComponent icon={providerIconMap[option]} size="4" />
                                    {option}
                                </Flex>
                            </Select.Item>
                        ))}
                        ref={setInputRef("agent_llm")}
                    />
                    {errors.agent_llm && <FormErrorMessage error={errors.agent_llm} notInForm />}
                </Box>
                <Box mt="4">
                    <Floating.LabelTextarea
                        label={t("bot.agent.System prompt")}
                        defaultValue={valuesRef.current["system_prompt"] ?? ""}
                        resize="none"
                        className="h-36"
                        disabled={isValidating}
                        onInput={(e) => setValue("system_prompt")(e.currentTarget.value)}
                        ref={setInputRef("system_prompt")}
                    />
                </Box>
                {inputs.map((input) => (
                    <Box mt="4" key={`default-bot-json-input-${selectedProvider}-${input.name}`}>
                        <DefaultTypedInput input={input} />
                        {errors[input.name] && <FormErrorMessage error={errors[input.name]} notInForm />}
                    </Box>
                ))}

                {change && (
                    <Box mt="4" className="text-center">
                        <SubmitButton type="button" size="sm" onClick={change} isValidating={isValidating}>
                            {t("common.Save")}
                        </SubmitButton>
                    </Box>
                )}
            </Box>
        </BotValueDefaultInputProvider>
    );
}

export default BotValueDefaultInput;
