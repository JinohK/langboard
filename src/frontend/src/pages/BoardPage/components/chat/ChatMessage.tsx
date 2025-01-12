import { IconComponent } from "@/components/base";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/Chat/ChatBubble";
import { ChatMessageModel } from "@/core/models";

export interface IChatMessageProps {
    chatMessage: ChatMessageModel.TModel;
}

function ChatMessage({ chatMessage }: IChatMessageProps): JSX.Element {
    const icon = chatMessage.useField("icon");
    const message = chatMessage.useField("message");
    const isReceived = chatMessage.useField("isReceived");
    const variant = isReceived ? "received" : "sent";

    return (
        <ChatBubble key={`chat-bubble-${chatMessage.uid}`} variant={variant}>
            {isReceived && <ChatBubbleAvatar fallback={<IconComponent icon={icon ?? "bot"} className="size-[60%]" />} />}
            {!message.length ? <ChatBubbleMessage isLoading /> : <ChatBubbleMessage variant={variant}>{message}</ChatBubbleMessage>}
        </ChatBubble>
    );
}

export default ChatMessage;
