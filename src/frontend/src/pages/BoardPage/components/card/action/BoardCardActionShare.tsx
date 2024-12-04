import { Button, IconComponent, Input, Popover } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface BoardCardActionShareProps extends ISharedBoardCardActionProps {}

const BoardCardActionShare = memo(({ buttonClassName }: BoardCardActionShareProps) => {
    const [t] = useTranslation();
    const [isCopied, setIsCopied] = useState(false);

    const link = location.href; // TODO: Get the link of the card

    const copyLink = (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.selectionStart = 0;
        e.currentTarget.selectionEnd = 0;
        e.currentTarget.selectionEnd = link.length;
        if (!navigator.clipboard) {
            document.execCommand("copy");
            return;
        } else {
            navigator.clipboard.writeText(link);
        }
        setIsCopied(true);
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="share" size="4" />
                    {t("card.Share")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end">
                <div className="mb-2 text-sm font-semibold">{t("card.Share this card")}</div>
                <div className="relative">
                    <Input
                        value={link}
                        readOnly
                        onFocus={copyLink}
                        onClick={copyLink}
                        className={cn("pr-9", isCopied && "focus-visible:ring-green-700")}
                    />
                    {isCopied && (
                        <IconComponent
                            icon="check"
                            size="5"
                            className={cn("absolute right-2 top-1/2 -translate-y-1/2", isCopied && "text-green-500")}
                        />
                    )}
                </div>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionShare;
