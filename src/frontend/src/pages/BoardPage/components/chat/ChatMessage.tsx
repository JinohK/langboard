import { Flex, IconComponent } from "@/components/base";
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
            <div
                className={cn(
                    "chat-content max-w-[85%] break-words rounded-sm py-2",
                    isReceived ? "rounded-tl-none" : "rounded-tr-none bg-secondary px-3",
                    isWaiting && !message ? "flex items-end" : ""
                )}
            >
                {isWaiting && !message ? (
                    <Flex justify="center" className="space-x-1">
                        <span className="sr-only">Loading...</span>
                        <div className="size-3 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]"></div>
                        <div className="size-3 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]"></div>
                        <div className="size-3 animate-bounce rounded-full bg-secondary"></div>
                    </Flex>
                ) : (
                    <Markdown>{message}</Markdown>
                )}
            </div>
        </Flex>
    );
}

export default ChatMessage;
