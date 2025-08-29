export type TBotValueInputType = "default" | "text" | "json" | "none";

export type TBotValueDefaultInputRefLike = {
    type: "default-bot-json";
    value: string;
    validate: (shouldFocus?: bool) => bool;
};

export type TSharedBotValueInputProps = Omit<IBotValueInputProps, "valueType">;

export interface IBotValueInputProps {
    value: string;
    valueType: TBotValueInputType;
    newValueRef: React.RefObject<string>;
    isValidating: bool;
    previewByDialog?: bool;
    change?: () => void;
    required?: bool;
    label: string;
    ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement | TBotValueDefaultInputRefLike>;
}
