import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Box, Button, Flex } from "@/components/base";
import { useAutoScroll } from "@/core/hooks/useAutoScroll";
import { cn } from "@/core/utils/ComponentUtils";
import TypeUtils from "@/core/utils/TypeUtils";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
    smooth?: bool;
    scrollToBottomRef?: React.RefObject<() => void>;
    isAtBottomRef?: React.RefObject<bool>;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
    ({ className, children, smooth = false, scrollToBottomRef, isAtBottomRef, ...props }, ref) => {
        const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } = useAutoScroll({
            smooth,
            content: children,
        });

        if (scrollToBottomRef) {
            scrollToBottomRef.current = scrollToBottom;
        }

        if (isAtBottomRef) {
            isAtBottomRef.current = isAtBottom;
        }

        return (
            <Box position="relative" size="full">
                <Flex
                    size="full"
                    direction="col"
                    p="4"
                    className={cn("overflow-y-auto", className)}
                    ref={(el) => {
                        scrollRef.current = el;
                        if (TypeUtils.isFunction(ref)) {
                            ref(el);
                        } else if (TypeUtils.isObject(ref)) {
                            (ref as React.RefObject<HTMLDivElement | null>).current = el;
                        }
                    }}
                    onWheel={disableAutoScroll}
                    onTouchMove={disableAutoScroll}
                    {...props}
                >
                    <Flex direction="col" gap="5">
                        {children}
                    </Flex>
                </Flex>

                {!isAtBottom && (
                    <Button
                        onClick={() => {
                            scrollToBottom();
                        }}
                        size="icon"
                        variant="outline"
                        className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 transform rounded-full shadow-md"
                        aria-label="Scroll to bottom"
                    >
                        <ArrowDown className="size-4" />
                    </Button>
                )}
            </Box>
        );
    }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
