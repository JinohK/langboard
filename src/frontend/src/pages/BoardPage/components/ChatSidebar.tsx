import { Button, DropdownMenu, Form, IconComponent, Input, Toast } from "@/components/base";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { useTranslation } from "react-i18next";
import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import Conversation from "@/pages/BoardPage/components/Conversation";
import useClearProjectChatMessages from "@/controllers/board/useClearProjectChatMessages";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { useRef } from "react";

export interface IChatSidebarProps {
    uid: string;
    socket: IConnectedSocket;
}

function ChatSidebar({ uid, socket }: IChatSidebarProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useClearProjectChatMessages();
    const { queryClient } = useQueryMutation();
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const sendChat = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;
        const buttonInput = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
        const chatInput = form["chat-message"];
        const chat = chatInput.value;

        buttonInput.disabled = true;
        chatInput.disabled = true;

        chatInput.value = "";

        if (!socket.send(SOCKET_CLIENT_EVENTS.BOARD.CHAT_SEND, { message: chat }).isConnected) {
            socket.reconnect();
            socket.send(SOCKET_CLIENT_EVENTS.BOARD.CHAT_SEND, { message: chat });
        }
    };

    const clearChat = () => {
        mutate(
            { uid },
            {
                onSuccess: () => {
                    queryClient.resetQueries({
                        queryKey: [`get-project-chat-messages-${uid}`],
                        exact: true,
                    });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    });

                    handle(error);
                },
            }
        );
    };

    return (
        <div className="flex h-full w-full flex-col">
            <div className="relative h-16">
                <div className="flex h-full items-center justify-center truncate text-nowrap text-lg">{t("project.Chat with AI")}</div>
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
                        <DropdownMenu.Item
                            className="flex cursor-pointer gap-1 font-semibold text-destructive focus:text-destructive"
                            onClick={clearChat}
                        >
                            <IconComponent icon="trash-2" size="4" strokeWidth="2" />
                            {t("project.Clear chat")}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
            <Conversation uid={uid} socket={socket} inputRef={inputRef} buttonRef={buttonRef} />
            <Form.Root className="flex h-12 w-full items-center" onSubmit={sendChat}>
                <Form.Field name="chat-message" className="mx-1 w-[calc(100%_-_theme(spacing.10))]">
                    <Form.Control asChild>
                        <Input type="text" placeholder={t("project.Enter a message")} className="h-10 px-2 py-1" ref={inputRef} />
                    </Form.Control>
                </Form.Field>
                <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    className="mr-1 h-10 w-10"
                    title={t("project.Send a message")}
                    titleSide="top"
                    ref={buttonRef}
                >
                    <IconComponent icon="send" size="4" />
                </Button>
            </Form.Root>
        </div>
    );
}

export default ChatSidebar;
