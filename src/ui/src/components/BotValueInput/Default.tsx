/* eslint-disable @typescript-eslint/no-explicit-any */
import { Utils } from "@langboard/core/utils";
import { useEffect, useRef, useState } from "react";
import { Agent, TAgentFormInput, TAgentModelName } from "@langboard/core/ai";
import { Box, Floating, Select, SubmitButton, Tooltip } from "@/components/base";
import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { TSharedBotValueInputProps } from "@/components/BotValueInput/types";
import useGetApiList from "@/controllers/api/settings/schemas/useGetApiList";
import MultiSelect from "@/components/MultiSelect";

function BotValueDefaultInput({ value, newValueRef, isValidating, required, change, ref }: TSharedBotValueInputProps) {
    const [t] = useTranslation();
    const valuesRef = useRef<Record<string, any>>(Utils.String.isJsonString(value) ? JSON.parse(value) : {});
    const { mutateAsync: getApiListMutateAsync } = useGetApiList({ interceptToast: true });
    const [selectedAgentModel, setSelectedAgentModel] = useState<TAgentModelName>((valuesRef.current["agent_llm"] as TAgentModelName) ?? "OpenAI");
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

            if (input.options) {
                delete valuesRef.current[input.name];
            }
        }

        setValue("agent_llm")(selectedAgentModel);
        setInputs(Agent.getInputForm(selectedAgentModel));
    }, [selectedAgentModel]);

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
                    label={t("bot.agent.Select a model")}
                    value={selectedAgentModel}
                    onValueChange={setSelectedAgentModel as (value: TAgentModelName) => void}
                    required={required}
                    disabled={isValidating}
                    options={Agent.AGENT_MODELS.map((option) => (
                        <Select.Item value={option} key={`default-bot-json-input-agent-${option}`}>
                            {option}
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
            {inputs.map((input) => {
                const options = input.options;
                const isSelection = !!options;

                let inputComp;
                if (!isSelection) {
                    setValue(input.name)(valuesRef.current[input.name] ?? input.defaultValue);
                    inputComp = (
                        <Floating.LabelInput
                            type="password"
                            name={input.name}
                            label={input.label}
                            autoComplete="off"
                            defaultValue={valuesRef.current[input.name] ?? input.defaultValue}
                            onInput={(e) => setValue(input.name)(e.currentTarget.value)}
                            required={required && !input.nullable}
                            disabled={isValidating}
                            ref={setInputRef(input.name)}
                        />
                    );
                } else {
                    setValue(input.name)(valuesRef.current[input.name] ?? input.defaultValue ?? options[0]);
                    inputComp = (
                        <BotValueDefaultInputSelect
                            selectedAgentModel={selectedAgentModel}
                            input={input}
                            options={options}
                            valuesRef={valuesRef}
                            setValue={setValue}
                            setInputRef={setInputRef}
                            required={required}
                            isValidating={isValidating}
                        />
                    );
                }

                return (
                    <Box mt="4" key={`default-bot-json-input-${selectedAgentModel}-${input.name}`}>
                        {inputComp}
                        {errors[input.name] && <FormErrorMessage error={errors[input.name]} notInForm />}
                    </Box>
                );
            })}

            {change && (
                <Box mt="4" className="text-center">
                    <SubmitButton type="button" size="sm" onClick={change} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Box>
            )}
        </Box>
    );
}

interface IBotValueDefaultInputSelect {
    selectedAgentModel: string;
    input: TAgentFormInput;
    options: string[];
    valuesRef: React.RefObject<Record<string, any>>;
    setValue: (name: string) => (value: any) => void;
    setInputRef: (name: string) => (element: HTMLElement | null) => void;
    required?: bool;
    isValidating: bool;
}

function BotValueDefaultInputSelect({
    selectedAgentModel,
    input,
    options,
    valuesRef,
    setValue,
    setInputRef,
    required,
    isValidating,
}: IBotValueDefaultInputSelect) {
    const [currentValue, setCurrentValue] = useState(valuesRef.current[input.name] ?? input.defaultValue ?? options[0]);

    useEffect(() => {
        setValue(input.name)(currentValue);
    }, [currentValue]);

    return (
        <Floating.LabelSelect
            id={`default-bot-json-input-${selectedAgentModel}-${input.name}`}
            label={input.label}
            value={currentValue}
            onValueChange={setCurrentValue}
            required={required && !input.nullable}
            disabled={isValidating}
            options={options.map((option) => (
                <Select.Item value={option} key={`default-bot-json-input-${selectedAgentModel}-${input.name}-${option}`}>
                    {option}
                </Select.Item>
            ))}
            ref={setInputRef(input.name)}
        />
    );
}

export default BotValueDefaultInput;
