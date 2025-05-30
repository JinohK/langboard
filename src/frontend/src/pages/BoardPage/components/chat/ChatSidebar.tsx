import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, DropdownMenu, Flex, IconComponent, Toast } from "@/components/base";
import useClearProjectChatMessages from "@/controllers/api/board/useClearProjectChatMessages";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import Conversation from "@/pages/BoardPage/components/chat/Conversation";
import { useNavigate } from "react-router-dom";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ChatMessageModel } from "@/core/models";
import ChatInput from "@/pages/BoardPage/components/chat/ChatInput";

const ChatSidebar = memo((): JSX.Element => {
    const { projectUID } = useBoardChat();
    const [t] = useTranslation();
    const navigateRef = useRef(useNavigate());
    const { mutate } = useClearProjectChatMessages();
    const [height, setHeight] = useState(0);

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
            <ChatInput height={height} setHeight={setHeight} />
        </Flex>
    );
});

export default ChatSidebar;
