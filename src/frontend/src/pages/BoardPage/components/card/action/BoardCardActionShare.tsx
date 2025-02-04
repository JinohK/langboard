import { Box, Button, IconComponent, Input, Popover } from "@/components/base";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionShareProps extends ISharedBoardCardActionProps {}

const BoardCardActionShare = memo(({ buttonClassName }: IBoardCardActionShareProps) => {
    const [t] = useTranslation();
    const [isCopied, setIsCopied] = useState(false);

    const link = location.href; // TODO: Get the link of the card

    const copyLink = (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        selectAllText(e.currentTarget);
        copyToClipboard(e.currentTarget.value);
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
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Share this card")}
                </Box>
                <Box position="relative">
                    <Input
                        value={link}
                        readOnly
                        onFocus={copyLink}
                        onClick={copyLink}
                        className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""}
                    />
                    {isCopied && <IconComponent icon="check" size="5" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                </Box>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionShare;
