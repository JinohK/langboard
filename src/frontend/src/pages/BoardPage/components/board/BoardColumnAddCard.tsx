import { Textarea } from "@/components/base";
import { useBoardAddCard } from "@/core/providers/BoardAddCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnAddCard = memo(() => {
    const { isAddingCard, isValidating, changeMode, scrollToBottom, canWrite, textareaRef, disableChangeModeAttr } = useBoardAddCard();
    const [t] = useTranslation();
    const [height, setHeight] = useState(0);

    const measureTextAreaHeight = () => {
        const cloned = textareaRef.current!.cloneNode(true) as HTMLTextAreaElement;
        cloned.style.width = `${textareaRef.current!.clientWidth}px`;
        cloned.style.height = "0px";
        document.body.appendChild(cloned);
        const height = cloned.scrollHeight;
        document.body.removeChild(cloned);
        cloned.remove();
        return height;
    };

    if (!isAddingCard || !canWrite) {
        return null;
    }

    return (
        <div
            className="-mb-2.5 mt-3 max-h-28 overflow-y-auto rounded-md bg-secondary/70 py-1 pl-2 pr-1"
            {...{ [disableChangeModeAttr]: true }}
            onClick={(e) => {
                if ((e.target as HTMLElement) === e.currentTarget) {
                    textareaRef.current?.focus();
                }
            }}
        >
            <Textarea
                ref={textareaRef}
                className={cn(
                    "min-h-12 resize-none break-all border-none bg-transparent p-0 scrollbar-hide",
                    "focus-visible:shadow-none focus-visible:ring-transparent focus-visible:ring-offset-transparent"
                )}
                style={{ height }}
                placeholder={t("board.Enter a title")}
                disabled={isValidating}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        changeMode("view");
                        return;
                    }

                    setHeight(measureTextAreaHeight());
                    setTimeout(() => {
                        scrollToBottom();
                    }, 0);
                }}
                onKeyUp={() => {
                    setHeight(measureTextAreaHeight());
                    setTimeout(() => {
                        scrollToBottom();
                    }, 0);
                }}
            />
        </div>
    );
});

export default BoardColumnAddCard;
