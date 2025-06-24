import { Box, Button, Dialog, Flex, Floating, IconComponent, Input, Popover, Textarea, Toast } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { isJsonString } from "@/core/utils/StringUtils";
import JsonView from "@uiw/react-json-view";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import TypeUtils from "@/core/utils/TypeUtils";
import { composeRefs } from "@udecode/cn";

interface IInternalBotValueInputProps {
    value: string;
    valueType: "text" | "json";
    newValueRef: React.RefObject<string>;
    isValidating: bool;
    previewByDialog?: bool;
    change?: () => void;
    ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
}

function InternalBotValueInput({ valueType, ...props }: IInternalBotValueInputProps) {
    switch (valueType) {
        case "json":
            return <InternalBotValueJsonInput {...props} />;
        default:
            return <InternalBotValueTextInput {...props} />;
    }
}

function InternalBotValueTextInput({ value, newValueRef, change, ref }: Omit<IInternalBotValueInputProps, "valueType">) {
    const [t] = useTranslation();
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
            label={t("settings.Internal bot value")}
            autoComplete="off"
            defaultValue={value}
            onBlur={change}
            onKeyDown={handleKeyEvent}
            onKeyUp={handleKeyEvent}
            ref={ref as React.RefObject<HTMLInputElement>}
        />
    );
}

function InternalBotValueJsonInput({
    value,
    newValueRef,
    previewByDialog,
    isValidating,
    change,
    ref,
}: Omit<IInternalBotValueInputProps, "valueType">) {
    const [t] = useTranslation();
    const [currentObject, setCurrentObject] = useState(isJsonString(value) ? JSON.parse(value) : {});
    const [currentJSON, setCurrentJSON] = useState(isJsonString(value) ? JSON.stringify(currentObject, undefined, "    ") : value);
    const [error, setError] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const viewerScrollableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDialogOpened, setIsDialogOpened] = useState(false);

    const onValueCHange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current?.value) {
            return;
        }

        const newValue = e.target.value;
        setCurrentJSON(newValue);

        if (
            textareaRef.current.value[0] !== "{" &&
            textareaRef.current.value[0] !== "}" &&
            textareaRef.current.value[0] !== "[" &&
            textareaRef.current.value[0] !== "]"
        ) {
            setError(t("metadata.errors.Invalid JSON format."));
            return;
        }

        try {
            const newObject = JSON.parse(textareaRef.current.value);
            setCurrentObject(newObject);
            setCurrentJSON(JSON.stringify(newObject, undefined, "    "));
            setError("");
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            }
            return;
        }

        setError("");
    };

    const save = () => {
        if (!textareaRef.current || isValidating) {
            return;
        }

        const isJson = isJsonString(textareaRef.current.value);
        newValueRef.current = isJson ? JSON.stringify(currentObject) : value;

        change?.();
    };

    useEffect(() => {
        if (!viewerScrollableRef.current || !textareaRef.current || previewByDialog) {
            return;
        }

        const onTextareaScroll = () => {
            viewerScrollableRef.current!.scrollTop = textareaRef.current!.scrollTop;
        };

        const onViewerScroll = () => {
            textareaRef.current!.scrollTop = viewerScrollableRef.current!.scrollTop;
        };
        textareaRef.current.addEventListener("scroll", onTextareaScroll);
        viewerScrollableRef.current.addEventListener("scroll", onViewerScroll);

        return () => {
            textareaRef.current?.removeEventListener("scroll", onTextareaScroll);
            viewerScrollableRef.current?.removeEventListener("scroll", onViewerScroll);
        };
    }, [value]);

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) {
            return;
        }

        const file = e.target.files[0];
        if (file.type !== "application/json") {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (!TypeUtils.isString(event.target?.result)) {
                return;
            }

            const newValue = event.target.result;
            if (isJsonString(newValue)) {
                const newObject = JSON.parse(newValue);
                setCurrentJSON(JSON.stringify(newObject, undefined, "    "));
                setCurrentObject(newObject);
                setError("");
                newValueRef.current = newValue;
                textareaRef.current?.focus();
            } else {
                Toast.Add.error(t("metadata.errors.Invalid JSON format."));
            }
        };
        reader.readAsText(file);
    };

    const valueInput = (
        <Textarea
            value={currentJSON}
            className="min-h-[calc(65vh_-_theme(spacing.28))] w-full p-0.5 text-[13px] leading-[1.32]"
            resize="none"
            onChange={onValueCHange}
            onBlur={save}
            disabled={isValidating}
            ref={composeRefs(textareaRef, ref as React.RefObject<HTMLTextAreaElement>)}
        />
    );

    const fileInput = <Input type="file" className="hidden" ref={fileInputRef} accept=".json" onChange={onFileInputChange} disabled={isValidating} />;

    let jsonViewer;
    if (error.length) {
        jsonViewer = <Textarea value={error} readOnly className="border-none p-0 font-bold text-destructive focus-visible:ring-0" resize="none" />;
    } else {
        jsonViewer = (
            <Box
                className={cn(
                    "max-h-[calc(65vh_-_theme(spacing.28))] min-h-[calc(65vh_-_theme(spacing.28))] w-full overflow-y-auto",
                    !previewByDialog ? "max-w-[calc(50%_-_theme(spacing.1))]" : "max-w-full"
                )}
                ref={viewerScrollableRef}
            >
                <JsonView value={currentObject} style={vscodeTheme} className="w-full break-words" />
            </Box>
        );
    }

    if (previewByDialog) {
        return (
            <Box position="relative" w="full">
                {valueInput}
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <Button variant="secondary" size="sm" className="absolute right-1.5 top-1 gap-1 opacity-70" disabled={isValidating}>
                            <IconComponent icon="ellipsis-vertical" size="4" />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content side="bottom" align="start">
                        <Flex direction="col">
                            {fileInput}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                }}
                                disabled={isValidating}
                            >
                                <IconComponent icon="braces" size="4" />
                                {t("settings.Upload JSON")}
                            </Button>
                            <Dialog.Root open={isDialogOpened} onOpenChange={setIsDialogOpened}>
                                <Dialog.Trigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-1" disabled={isValidating}>
                                        <IconComponent icon="braces" size="4" />
                                        {t("common.JSON Viewer")}
                                    </Button>
                                </Dialog.Trigger>
                                <Dialog.Content className="max-h-[70vh] max-w-screen-md">
                                    <Dialog.Title>{t("common.JSON Viewer")}</Dialog.Title>
                                    <Dialog.Description asChild className="my-3 text-base text-primary-foreground">
                                        <Box>{jsonViewer}</Box>
                                    </Dialog.Description>
                                    <Dialog.Footer>
                                        <Button type="button" variant="secondary" size="sm" onClick={() => setIsDialogOpened(false)}>
                                            {t("common.Cancel")}
                                        </Button>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Root>
                        </Flex>
                    </Popover.Content>
                </Popover.Root>
            </Box>
        );
    }

    return (
        <Flex
            direction={{
                initial: "col",
                sm: "row",
            }}
            gap="2"
            w="full"
        >
            <Box position="relative" w="full" className="max-w-[calc(50%_-_theme(spacing.1))]">
                {valueInput}
                <Box position="absolute" top="1" right="1.5" className="opacity-70">
                    {fileInput}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                            fileInputRef.current?.click();
                        }}
                        disabled={isValidating}
                    >
                        <IconComponent icon="braces" size="4" />
                        {t("settings.Upload JSON")}
                    </Button>
                </Box>
            </Box>
            {jsonViewer}
        </Flex>
    );
}

export default InternalBotValueInput;
