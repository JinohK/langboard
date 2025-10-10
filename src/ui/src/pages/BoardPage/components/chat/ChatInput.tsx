import { Box, Button, Flex, IconComponent, Input, Textarea, Toast } from "@/components/base";
import useUploadProjectChatAttachment from "@/controllers/api/board/chat/useUploadProjectChatAttachment";
import useBoardChatCancelHandlers from "@/controllers/socket/board/chat/useBoardChatCancelHandlers";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import ChatTemplateListDialog from "@/pages/BoardPage/components/chat/ChatTemplateListDialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import mimeTypes from "react-native-mime-types";
import { MAX_FILE_SIZE_MB } from "@/constants";
import useBoardChatSentHandlers from "@/controllers/socket/board/chat/useBoardChatSentHandlers";

export interface IChatInputProps {
    height: number;
    setHeight: (height: number) => void;
}

function ChatInput({ height, setHeight }: IChatInputProps) {
    const { projectUID, isSending, setIsSending, isUploading, setIsUploading, currentSessionUID, chatTaskIdRef } = useBoardChat();
    const [t] = useTranslation();
    const { mutateAsync: uploadProjectChatAttachmentMutateAsync } = useUploadProjectChatAttachment();
    const { send: cancelChat } = useBoardChatCancelHandlers({ projectUID });
    const { send: sendChat } = useBoardChatSentHandlers({ projectUID });
    const chatAttachmentRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const [previewElement, setPreviewElement] = useState<React.ReactNode | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const updateHeight = useCallback(() => {
        if (!Utils.Type.isElement(chatInputRef.current, "textarea")) {
            return;
        }

        const selectionStart = chatInputRef.current.selectionStart;
        const selectionEnd = chatInputRef.current.selectionEnd;
        let measuredHeight = measureTextAreaHeight(chatInputRef.current);
        const maxHeight = window.innerHeight * 0.2;
        if (measuredHeight > maxHeight) {
            measuredHeight = maxHeight;
        }
        setHeight(measuredHeight);
        chatInputRef.current.selectionStart = selectionStart;
        chatInputRef.current.selectionEnd = selectionEnd;
    }, [setHeight]);

    const send = useCallback(async () => {
        if (!chatInputRef.current || !chatAttachmentRef.current) {
            return;
        }

        if (isUploading) {
            abortControllerRef.current?.abort();
            return;
        }

        if (!isUploading && isSending) {
            cancelChat({
                project_uid: projectUID,
                task_id: chatTaskIdRef.current,
            });
            return;
        }

        setIsSending(true);

        let filePath: string | undefined = undefined;
        const attachment = chatAttachmentRef.current.files?.[0];
        if (attachment) {
            setIsUploading(true);
            abortControllerRef.current = new AbortController();

            let result;
            try {
                result = await uploadProjectChatAttachmentMutateAsync({
                    project_uid: projectUID,
                    attachment,
                    abortController: abortControllerRef.current,
                });
            } catch {
                Toast.Add.error(
                    t("errors.Failed to upload attachment. File size may be too large (Max size is {size}MB).", { size: MAX_FILE_SIZE_MB })
                );
                setIsUploading(false);
                setIsSending(false);
                return;
            }

            setIsUploading(false);
            filePath = result.file_path;
        }

        const chatMessage = chatInputRef.current.value.trim();

        if (!chatMessage.length && !filePath) {
            setIsSending(false);
            return;
        }

        chatInputRef.current.value = "";
        chatAttachmentRef.current.value = "";
        setPreviewElement(null);
        updateHeight();

        let tried = 0;
        let triedTimeout: NodeJS.Timeout | undefined;
        const trySendChat = () => {
            if (tried >= 5) {
                Toast.Add.error(t("errors.Server has been temporarily disabled. Please try again later."));
                setIsSending(false);
                return true;
            }

            ++tried;

            chatTaskIdRef.current = Utils.String.Token.uuid();

            return sendChat({
                message: chatMessage,
                file_path: filePath,
                task_id: chatTaskIdRef.current,
                session_uid: currentSessionUID,
            }).isConnected;
        };

        const trySendChatWrapper = () => {
            if (triedTimeout) {
                clearTimeout(triedTimeout);
                triedTimeout = undefined;
            }

            const isSent = trySendChat();
            if (!isSent) {
                triedTimeout = setTimeout(trySendChatWrapper, 1000);
            }
        };

        if (!trySendChat()) {
            triedTimeout = setTimeout(trySendChatWrapper, 1000);
        }
    }, [updateHeight, isSending, setIsSending, isUploading, setIsUploading, currentSessionUID]);

    const onAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setPreviewElement(null);
            return;
        }

        const file = e.target.files[0];
        setPreviewElement(<CHatInputFilePreview file={file} />);
    };

    const clearAttachmentPreview = () => {
        setPreviewElement(null);
        if (chatAttachmentRef.current) {
            chatAttachmentRef.current.value = "";
        }
    };

    return (
        <Flex
            direction="col"
            gap="1.5"
            w="full"
            py="1"
            position="relative"
            className="min-h-[calc(theme(spacing.24)_-_1px)] border-t bg-background focus-within:ring-ring"
        >
            <Flex
                position="absolute"
                top="-28"
                h="28"
                py="2"
                w="full"
                justify="center"
                items="center"
                className={cn("bg-secondary/70", !previewElement && "hidden")}
            >
                {!isSending && (
                    <Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-1" onClick={clearAttachmentPreview}>
                        <IconComponent icon="x" size="4" />
                    </Button>
                )}
                {previewElement}
            </Flex>
            <Textarea
                placeholder={t("project.Enter a message")}
                className="max-h-[20vh] min-h-12 border-none px-2 shadow-none focus-visible:ring-0"
                resize="none"
                disabled={isSending}
                style={{ height }}
                onKeyDown={(e) => {
                    if (e.shiftKey && e.key === "Enter") {
                        return;
                    }

                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        send();
                    }
                }}
                onChange={updateHeight}
                ref={chatInputRef}
            />
            <Flex justify="between" items="center">
                <Box>
                    <Input
                        type="file"
                        hidden
                        accept="image/*, .txt, .xls, .xlsx"
                        disabled={isSending}
                        onChange={onAttachmentChange}
                        ref={chatAttachmentRef}
                        wrapperProps={{ className: "hidden" }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title={t("common.Upload")}
                        disabled={isSending}
                        titleSide="top"
                        titleAlign="start"
                        onClick={() => chatAttachmentRef.current?.click()}
                    >
                        <IconComponent icon="paperclip" size="4" />
                    </Button>
                    <ChatTemplateListDialog chatInputRef={chatInputRef} updateHeight={updateHeight} />
                </Box>
                <Button
                    type="button"
                    variant={isSending ? "secondary" : "default"}
                    size={isSending ? "icon-sm" : "sm"}
                    className={"mr-1 gap-1.5 px-2"}
                    title={t(isSending ? "project.Stop" : "project.Send a message")}
                    titleSide="top"
                    onClick={send}
                >
                    <IconComponent
                        icon={isSending ? (isUploading ? "loader-circle" : "square") : "send"}
                        size="3"
                        className={cn(isUploading && "animate-spin")}
                    />
                    {!isSending && t("common.Send")}
                </Button>
            </Flex>
        </Flex>
    );
}

interface IChatInputFilePreviewProps {
    file: File;
}

function CHatInputFilePreview({ file }: IChatInputFilePreviewProps) {
    const type = mimeTypes.lookup(file.name) || "file";
    const [previewData, setPreviewData] = useState<string | null>(null);

    useEffect(() => {
        if (!type.startsWith("image/")) {
            setPreviewData(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setPreviewData(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    return (
        <>
            {type.startsWith("image/") && previewData ? (
                <img src={previewData ?? ""} alt={file.name} className="h-full w-auto" />
            ) : (
                <Flex direction="col" items="center" className="text-center" w="full">
                    <IconComponent icon="file" size="6" />
                    <span className="w-[calc(100%_-_theme(spacing.4))] truncate">{file.name}</span>
                </Flex>
            )}
        </>
    );
}

export default ChatInput;
