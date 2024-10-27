import { IconComponent } from "@/components/base";
import { IChatMessage } from "@/controllers/board/useGetProjectChatMessages";
import { cn } from "@/core/utils/ComponentUtils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface IChatMessageProps extends IChatMessage {
    isWaiting?: boolean;
    className?: string;
}

function ChatMessage({ uid, icon = "bot", message, isReceived, isWaiting, className }: IChatMessageProps): JSX.Element {
    return (
        <div className={cn("flex", isReceived ? "flex-row" : "flex-row-reverse", className)} id={`chat-${uid}`}>
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
                    <div className="flex justify-center space-x-1">
                        <span className="sr-only">Loading...</span>
                        <div className="h-3 w-3 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]"></div>
                        <div className="h-3 w-3 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]"></div>
                        <div className="h-3 w-3 animate-bounce rounded-full bg-secondary"></div>
                    </div>
                ) : (
                    <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>{message}</Markdown>
                )}
            </div>
        </div>
    );
}

export default ChatMessage;
