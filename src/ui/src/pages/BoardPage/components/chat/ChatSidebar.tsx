import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex, IconComponent } from "@/components/base";
import Conversation from "@/pages/BoardPage/components/chat/Conversation";
import ChatInput from "@/pages/BoardPage/components/chat/ChatInput";
import ChatSessionList from "@/pages/BoardPage/components/chat/ChatSessionList";
import { cn } from "@/core/utils/ComponentUtils";
import ChatSessionMoreMenu from "@/pages/BoardPage/components/chat/ChatSessionMoreMenu";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ChatSessionModel } from "@/core/models";
import { TDroppableAreaState } from "@/core/helpers/dnd/types";
import { DROPPABLE_AREA_IDLE } from "@/core/helpers/dnd/createDndDroppableAreaEvents";
import invariant from "tiny-invariant";
import { columnRowDndHelpers } from "@/core/helpers/dnd";
import { BOARD_DND_SETTINGS } from "@/pages/BoardPage/components/board/BoardConstants";
import { useBoardController } from "@/core/providers/BoardController";
import { isModel } from "@/core/models/ModelRegistry";
import { createBoardDroppableArea } from "@/pages/BoardPage/BoardUtils";
import { TChatScope } from "@langboard/core/types";

export interface IChatSidebarProps {
    ref: React.RefObject<HTMLDivElement | null>;
}

const ChatSidebar = memo(({ ref }: IChatSidebarProps): JSX.Element => {
    const [t] = useTranslation();
    const { chatResizableSidebar } = useBoardController();
    const [state, setState] = useState<TDroppableAreaState>(DROPPABLE_AREA_IDLE);
    const { setSelectedScope } = useBoardChat();

    useEffect(() => {
        const area = ref?.current;
        invariant(area);

        return columnRowDndHelpers.droppableArea({
            droppableAreas: createBoardDroppableArea({
                chatSidebarRef: ref,
                onDropInChatSidebar: (model) => {
                    let scopeType: TChatScope | undefined;
                    if (isModel(model, "ProjectColumn")) {
                        scopeType = "project_column";
                    } else if (isModel(model, "ProjectCard")) {
                        scopeType = "card";
                    } else if (isModel(model, "ProjectWiki")) {
                        scopeType = "project_wiki";
                    }

                    if (!scopeType) {
                        return;
                    }

                    setSelectedScope([scopeType, model.uid]);
                },
            }),
            settings: BOARD_DND_SETTINGS,
            setState,
        });
    }, [chatResizableSidebar, setSelectedScope]);

    return (
        <Flex direction="col" size="full" position="relative" ref={ref}>
            <Box
                position="absolute"
                size="full"
                top="0"
                left="0"
                className={cn(
                    "pointer-events-none bg-background/50 backdrop-blur-sm transition-all duration-200 ease-in-out",
                    state.type === "idle" ? "opacity-0" : "opacity-100"
                )}
                z={state.type === "idle" ? "-50" : "50"}
            >
                <Flex items="center" justify="center" size="full" textSize={{ initial: "lg", md: "xl" }} className="truncate text-nowrap">
                    {t("project.Drop here to add")}
                </Flex>
            </Box>
            <ChatSidebarDisplay />
        </Flex>
    );
});

function ChatSidebarDisplay() {
    const [t] = useTranslation();
    const [height, setHeight] = useState(0);
    const { isSessionListOpened } = useBoardChat();

    return (
        <>
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
        </>
    );
}

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
