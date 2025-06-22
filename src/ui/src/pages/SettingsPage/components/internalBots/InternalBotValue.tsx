import { Alert, Box, Button, Flex, Floating, IconComponent, Input, ScrollArea, Textarea, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { isJsonString } from "@/core/utils/StringUtils";
import JsonView from "@uiw/react-json-view";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import TypeUtils from "@/core/utils/TypeUtils";

const InternalBotValue = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const { navigateRef } = useAppSetting();
    const platformRunningType = internalBot.useField("platform_running_type");
    const value = internalBot.useField("value");
    const valueType = useMemo(() => {
        switch (platformRunningType) {
            case InternalBotModel.EInternalBotPlatformRunningType.FlowJson:
                return "json";
            default:
                return "text";
        }
    }, [platformRunningType]);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });
    const newValueRef = useRef<string>(value);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !newValueRef.current) {
            return;
        }

        const newValue = newValueRef.current.trim();
        if (value.trim() === newValue || !newValue) {
            newValueRef.current = newValue;
            return;
        }

        const promise = mutateAsync({
            value: newValue,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("settings.successes.Internal bot value changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box w="full">
            {platformRunningType === InternalBotModel.EInternalBotPlatformRunningType.FlowJson && (
                <Alert variant="warning" icon="alert-triangle" title={t("common.Warning")} className="mb-2">
                    {t("settings.Flow json is only supported in the internal flows server.")}
                </Alert>
            )}
            <InternalBotValueProxy value={value} valueType={valueType} newValueRef={newValueRef} isValidating={isValidating} change={change} />
        </Box>
    );
});

interface IInternalBotValueProxyProps {
    value: string;
    valueType: "text" | "json";
    newValueRef: React.RefObject<string>;
    isValidating: bool;
    change: () => void;
}

function InternalBotValueProxy({ valueType, ...props }: IInternalBotValueProxyProps) {
    switch (valueType) {
        case "json":
            return <InternalBotValueJsonInput {...props} />;
        default:
            return <InternalBotValueTextInput {...props} />;
    }
}

function InternalBotValueTextInput({ value, newValueRef, change }: Omit<IInternalBotValueProxyProps, "valueType">) {
    const [t] = useTranslation();
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            change();
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
            onKeyDown={handleKeyDown}
        />
    );
}

function InternalBotValueJsonInput({ value, newValueRef, isValidating, change }: Omit<IInternalBotValueProxyProps, "valueType">) {
    const [t] = useTranslation();
    const [currentObject, setCurrentObject] = useState(isJsonString(value) ? JSON.parse(value) : {});
    const [currentJSON, setCurrentJSON] = useState(isJsonString(value) ? JSON.stringify(currentObject, undefined, "    ") : value);
    const [error, setError] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const viewerScrollableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        change();
    };

    useEffect(() => {
        if (!viewerScrollableRef.current || !textareaRef.current) {
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
                <Textarea
                    value={currentJSON}
                    className="min-h-[calc(65vh_-_theme(spacing.28))] w-full p-0.5 text-[13px] leading-[1.32]"
                    resize="none"
                    onChange={onValueCHange}
                    onBlur={save}
                    disabled={isValidating}
                    ref={textareaRef}
                />
                <Box position="absolute" top="1" right="1.5" className="opacity-70">
                    <Input type="file" className="hidden" ref={fileInputRef} accept=".json" onChange={onFileInputChange} disabled={isValidating} />
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
            {error.length ? (
                <Textarea value={error} readOnly className="border-none p-0 font-bold text-destructive focus-visible:ring-0" resize="none" />
            ) : (
                <ScrollArea.Root
                    className={cn(
                        "max-h-[calc(65vh_-_theme(spacing.28))] min-h-[calc(65vh_-_theme(spacing.28))] w-full max-w-[calc(50%_-_theme(spacing.1))]"
                    )}
                    viewportRef={viewerScrollableRef}
                >
                    <JsonView value={currentObject} style={vscodeTheme} className="w-full break-words" />
                </ScrollArea.Root>
            )}
        </Flex>
    );
}

export default InternalBotValue;
