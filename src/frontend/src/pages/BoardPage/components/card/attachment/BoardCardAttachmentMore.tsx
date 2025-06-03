import { Button, DropdownMenu, IconComponent } from "@/components/base";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import BoardCardAttachmentMoreDelete from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMoreDelete";
import BoardCardAttachmentMoreDownload from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMoreDownload";
import BoardCardAttachmentMoreRename from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMoreRename";
import { IBaseBoardCardAttachmentMoreProps } from "@/pages/BoardPage/components/card/attachment/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardAttachmentMoreProps extends Omit<IBaseBoardCardAttachmentMoreProps, "setIsMoreMenuOpened"> {}

function BoardCardAttachmentMore({ attachment, isValidating, setIsValidating }: IBoardCardAttachmentMoreProps): JSX.Element {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    const sharedErrorHandler = (error: unknown) => {
        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler({}, messageRef);

        handle(error);
        return messageRef.message;
    };

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }
        setIsOpened(opened);
    };

    return (
        <DropdownMenu.Root modal={false} open={isOpened} onOpenChange={changeOpenedState}>
            <DropdownMenu.Trigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="h-8 w-5 sm:size-8" title={t("common.More")}>
                    <IconComponent icon="ellipsis-vertical" size="4" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Group>
                    <BoardCardAttachmentMoreDownload attachment={attachment} setIsMoreMenuOpened={setIsOpened} />
                    <BoardCardAttachmentMoreRename
                        attachment={attachment}
                        isValidating={isValidating}
                        setIsValidating={setIsValidating}
                        setIsMoreMenuOpened={setIsOpened}
                        sharedErrorHandler={sharedErrorHandler}
                    />
                    <BoardCardAttachmentMoreDelete
                        attachment={attachment}
                        isValidating={isValidating}
                        setIsValidating={setIsValidating}
                        setIsMoreMenuOpened={setIsOpened}
                        sharedErrorHandler={sharedErrorHandler}
                    />
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardCardAttachmentMore;
