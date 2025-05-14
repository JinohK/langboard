import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, DropdownMenu, Flex, IconComponent, Textarea, Toast } from "@/components/base";
import useClearProjectChatMessages from "@/controllers/api/board/useClearProjectChatMessages";
import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import Conversation from "@/pages/BoardPage/components/chat/Conversation";
import { useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import useBoardChatCancelHandlers from "@/controllers/socket/board/useBoardChatCancelHandlers";
import { ChatMessageModel } from "@/core/models";
import TypeUtils from "@/core/utils/TypeUtils";
import { measureTextAreaHeight } from "@/core/utils/ComponentUtils";

const ChatSidebar = memo((): JSX.Element => {
    const { projectUID, isSending, setIsSending } = useBoardChat();
    const [t] = useTranslation();
    const navigateRef = useRef(usePageNavigate());
    const socket = useSocket();
    const { mutate } = useClearProjectChatMessages();
    const { send: cancelChat } = useBoardChatCancelHandlers({ projectUID });
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const [height, setHeight] = useState(0);
    const updateHeight = useCallback(() => {
        if (!TypeUtils.isElement(chatInputRef.current, "textarea")) {
            return;
        }

        setHeight(measureTextAreaHeight(chatInputRef.current) + 2);
    }, [setHeight]);

    const sendChat = () => {
        if (!chatInputRef.current) {
            return;
        }

        if (isSending) {
            cancelChat({});
            return;
        }

        setIsSending(true);

        const chatMessage = chatInputRef.current.value.trim();

        if (!chatMessage.length) {
            setIsSending(false);
            return;
        }

        chatInputRef.current.value = "";

        let tried = 0;
        let triedTimeout: NodeJS.Timeout | undefined;
        const trySendChat = () => {
            if (tried >= 5) {
                Toast.Add.error(t("errors.Server has been temporarily disabled. Please try again later."));
                setIsSending(false);
                return;
            }

            ++tried;

            return socket.send({
                topic: ESocketTopic.Board,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CHAT_SEND,
                data: { message: chatMessage },
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
    };

    const clearChat = () => {
        mutate(
            { uid: projectUID },
            {
                onSuccess: () => {
                    ChatMessageModel.Model.deleteModels((model) => model.projectUID === projectUID);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    });

                    handle(error);
                },
            }
        );
    };

    return (
        <Flex direction="col" size="full">
            <Box position="relative" h="16">
                <Flex items="center" justify="center" h="full" textSize="lg" className="truncate text-nowrap">
                    {t("project.Chat with AI")}
                </Flex>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 right-[unset] top-1/2 -translate-y-1/2 transform md:left-[unset] md:right-1"
                        >
                            <IconComponent icon="ellipsis-vertical" size="5" />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="start">
                        <DropdownMenu.Item className="flex gap-1 font-semibold text-destructive focus:text-destructive" onClick={clearChat}>
                            <IconComponent icon="trash-2" size="4" strokeWidth="2" />
                            {t("project.Clear chat")}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Box>
            <Conversation chatInputHeight={height} />
            <Flex items="start" minH="10" py="1" w="full" my="1">
                <Box mx="1" className="w-[calc(100%_-_theme(spacing.10))]">
                    <Textarea
                        placeholder={t("project.Enter a message")}
                        className="max-h-[20vh] min-h-10 px-2"
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
                                sendChat();
                            }
                        }}
                        onChange={updateHeight}
                        ref={chatInputRef}
                    />
                </Box>
                <Button
                    type="button"
                    variant={isSending ? "secondary" : "default"}
                    size="icon"
                    className="mr-1 size-10"
                    title={t("project.Send a message")}
                    titleSide="top"
                    onClick={sendChat}
                >
                    <IconComponent icon={isSending ? "square" : "send"} size="4" />
                </Button>
            </Flex>
        </Flex>
    );
});

export default ChatSidebar;
