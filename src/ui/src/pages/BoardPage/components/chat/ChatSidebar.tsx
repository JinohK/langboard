import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex, IconComponent } from "@/components/base";
import Conversation from "@/pages/BoardPage/components/chat/Conversation";
import ChatInput from "@/pages/BoardPage/components/chat/ChatInput";
import ChatSessionList from "@/pages/BoardPage/components/chat/ChatSessionList";
import { cn } from "@/core/utils/ComponentUtils";
import ChatSessionMoreMenu from "@/pages/BoardPage/components/chat/ChatSessionMoreMenu";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ChatSessionModel } from "@/core/models";

const ChatSidebar = memo((): JSX.Element => {
    const [t] = useTranslation();
    const [height, setHeight] = useState(0);
    const { isSessionListOpened } = useBoardChat();

    return (
        <Flex direction="col" size="full" position="relative">
            <Box position="relative" h="16" className="border-b border-border">
                <Flex items="center" justify="center" h="full" textSize={{ initial: "base", md: "lg" }} className="truncate text-nowrap">
                    {t("project.Chat with AI")}
                </Flex>
                <ChatSidebarSessionListButton />
                <ChatSessionMoreMenuButton />
            </Box>
            <Flex justify="between" position="relative" h="full" className="max-h-[calc(100%_-_theme(spacing.16))]">
                <ChatSessionList />
                <Box
                    h="full"
                    className={cn(
                        "w-full max-w-full transition-all duration-200 ease-in-out",
                        isSessionListOpened && "overflow-hidden md:max-w-[calc(100%_-_theme(spacing.60))]"
                    )}
                >
                    <Conversation chatInputHeight={height} />
                    <ChatInput height={height} setHeight={setHeight} />
                </Box>
            </Flex>
        </Flex>
    );
});

function ChatSidebarSessionListButton() {
    const { isSessionListOpened, setIsSessionListOpened } = useBoardChat();
    const [t] = useTranslation();

    const handleClick = () => {
        setIsSessionListOpened(!isSessionListOpened);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("absolute left-1 top-1/2 -translate-y-1/2 transform", isSessionListOpened && "bg-accent/50")}
            title={t("project.Session list")}
            titleAlign="start"
            titleSide="bottom"
            onClick={handleClick}
        >
            <IconComponent icon="panel-left" size="5" />
        </Button>
    );
}

function ChatSessionMoreMenuButton() {
    const { currentSessionUID } = useBoardChat();
    const sessions = ChatSessionModel.Model.useModels((model) => model.uid === currentSessionUID, [currentSessionUID]);

    return (
        <ChatSessionMoreMenu
            icon="ellipsis-vertical"
            iconSize="5"
            menuButtonProps={{
                variant: "ghost",
                size: "icon",
                className: "absolute left-12 right-[unset] top-1/2 -translate-y-1/2 transform md:left-[unset] md:right-1",
            }}
            session={sessions[0]}
        />
    );
}

export default ChatSidebar;
