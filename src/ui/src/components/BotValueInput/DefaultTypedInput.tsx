import { Floating, Select } from "@/components/base";
import { useBotValueDefaultInput } from "@/components/BotValueInput/DefaultProvider";
import { TAgentFormInput, IStringAgentFormInput, ISelectAgentFormInput, IIntegerAgentFormInput } from "@langboard/core/ai";
import { useEffect, useState } from "react";

export interface IDefaultTypedInputProps {
    input: TAgentFormInput;
}

function DefaultTypedInput({ input }: IDefaultTypedInputProps) {
    const { valuesRef, setValue } = useBotValueDefaultInput();
    switch (input.type) {
        case "text":
        case "password":
            setValue(input.name)(valuesRef.current[input.name] ?? input.defaultValue);
            return <DefaultStringInput input={input} />;
        case "select":
            setValue(input.name)(valuesRef.current[input.name] ?? input.defaultValue ?? input.options[0]);
            return <DefaultSelectInput input={input} />;
        case "integer":
            setValue(input.name)(valuesRef.current[input.name] ?? input.defaultValue ?? input.min);
            return <DefaultIntegerInput input={input} />;
    }
}

function DefaultStringInput({ input }: { input: IStringAgentFormInput }) {
    const { valuesRef, setInputRef, setValue, isValidating, required } = useBotValueDefaultInput();

    return (
        <Floating.LabelInput
            type={input.type}
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
}

function DefaultSelectInput({ input }: { input: ISelectAgentFormInput }) {
    const { selectedAgentModel, valuesRef, setInputRef, setValue, isValidating, required } = useBotValueDefaultInput();
    const [currentValue, setCurrentValue] = useState(valuesRef.current[input.name] ?? input.defaultValue ?? input.options[0]);

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
            options={input.options.map((option) => (
                <Select.Item value={option} key={`default-bot-json-input-${selectedAgentModel}-${input.name}-${option}`}>
                    {option}
                </Select.Item>
            ))}
            ref={setInputRef(input.name)}
        />
    );
}

function DefaultIntegerInput({ input }: { input: IIntegerAgentFormInput }) {
    const { valuesRef, setValue, required, isValidating, setInputRef } = useBotValueDefaultInput();

    return (
        <Floating.LabelInput
            type="number"
            name={input.name}
            label={input.label}
            autoComplete="off"
            defaultValue={valuesRef.current[input.name] ?? input.defaultValue ?? input.min}
            onInput={(e) => setValue(input.name)(e.currentTarget.value)}
            required={required && !input.nullable}
            disabled={isValidating}
            min={input.min}
            max={input.max}
            ref={setInputRef(input.name)}
        />
    );
}

export default DefaultTypedInput;
