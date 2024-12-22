import { Box, Flex, IconComponent } from "@/components/base";
import CachedImage from "@/components/CachedImage";
import Markdown from "@/components/Markdown";
import { ChatMessageModel } from "@/core/models";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { cn } from "@/core/utils/ComponentUtils";

export interface IChatMessageProps extends ChatMessageModel.Interface {
    isWaiting?: bool;
    className?: string;
}

function ChatMessage({ uid, icon = "bot", message, isReceived, isWaiting, className }: IChatMessageProps): JSX.Element {
    const { bot } = useBoardChat();

    let botAvatar;
    if (isReceived) {
        if (bot.avatar) {
            botAvatar = <CachedImage src={bot.avatar} size="full" />;
        } else {
            botAvatar = <IconComponent icon={icon} size="full" className="flex items-center justify-center text-xs" />;
        }
    }

    return (
        <Flex direction={isReceived ? "row" : "row-reverse"} className={className} id={`chat-${uid}`}>
            {isReceived && (
                <Box size="8" className="mr-2 mt-1 rounded-full bg-muted">
                    {botAvatar}
                </Box>
            )}
            <Box
                py="2"
                rounded="sm"
                className={cn(
                    "chat-content max-w-[85%] break-words",
                    isReceived ? "rounded-tl-none" : "rounded-tr-none bg-secondary px-3",
                    isWaiting && !message ? "flex items-end" : ""
                )}
            >
                {isWaiting && !message ? (
                    <Flex justify="center" className="space-x-1">
                        <span className="sr-only">Loading...</span>
                        <Box size="3" rounded="full" className="animate-bounce bg-secondary [animation-delay:-0.3s]" />
                        <Box size="3" rounded="full" className="animate-bounce bg-secondary [animation-delay:-0.15s]" />
                        <Box size="3" rounded="full" className="animate-bounce bg-secondary" />
                    </Flex>
                ) : (
                    <Markdown>{message}</Markdown>
                )}
            </Box>
        </Flex>
    );
}

export default ChatMessage;
