import { Floating } from "@/components/base";
import { TSharedBotValueInputProps } from "@/components/bots/BotValueInput/types";

function BotValueTextInput({ value, label, newValueRef, change, required, ref }: TSharedBotValueInputProps) {
    const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            change?.();
            return;
        }

        newValueRef.current = e.currentTarget.value;
    };

    return (
        <Floating.LabelInput
            label={label}
            autoComplete="off"
            defaultValue={value}
            onBlur={change}
            onKeyDown={handleKeyEvent}
            onKeyUp={handleKeyEvent}
            required={required}
            ref={ref as React.RefObject<HTMLInputElement>}
        />
    );
}

export default BotValueTextInput;
