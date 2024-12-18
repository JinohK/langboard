import { Box, Flex, IconComponent } from "@/components/base";
import Markdown from "@/components/Markdown";
import { ChatMessageModel } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";

export interface IChatMessageProps extends ChatMessageModel.Interface {
    isWaiting?: bool;
    className?: string;
}

function ChatMessage({ uid, icon = "bot", message, isReceived, isWaiting, className }: IChatMessageProps): JSX.Element {
    return (
        <Flex direction={isReceived ? "row" : "row-reverse"} className={className} id={`chat-${uid}`}>
            {isReceived && (
                <IconComponent icon={icon} size="8" className="mr-2 mt-1 flex items-center justify-center rounded-full bg-muted text-xs" />
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
