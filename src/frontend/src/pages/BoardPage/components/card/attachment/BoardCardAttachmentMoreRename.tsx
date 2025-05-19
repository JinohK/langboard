import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeCardAttachmentName from "@/controllers/api/card/attachment/useChangeCardAttachmentName";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { IBaseBoardCardAttachmentMoreProps } from "@/pages/BoardPage/components/card/attachment/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardAttachmentMoreRenameProps extends IBaseBoardCardAttachmentMoreProps {
    sharedErrorHandler: (error: unknown) => string;
}

function BoardCardAttachmentMoreRename({
    attachment,
    isValidating,
    setIsValidating,
    setIsMoreMenuOpened,
    sharedErrorHandler,
}: IBoardCardAttachmentMoreRenameProps): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: changeCardAttachmentNameMutateAsync } = useChangeCardAttachmentName();
    const nameInputId = `board-card-attachment-name-input-${attachment.uid}`;
    const name = attachment.useField("name");

    const changeAttachmentName = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const nameInput = document.getElementById(nameInputId) as HTMLInputElement;
        const nameValue = nameInput.value.trim();

        if (!nameValue) {
            Toast.Add.error(t("card.errors.File name cannot be empty."));
            setIsValidating(false);
            nameInput.focus();
            return;
        }

        const promise = changeCardAttachmentNameMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            attachment_uid: attachment.uid,
            attachment_name: nameValue,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.File name changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
            },
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            changeAttachmentName();
        }
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item onClick={handleClick}>{t("card.Rename")}</DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Floating.LabelInput label={t("card.File name")} id={nameInputId} defaultValue={name} onKeyDown={handleKeyDown} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeAttachmentName} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardCardAttachmentMoreRename;
