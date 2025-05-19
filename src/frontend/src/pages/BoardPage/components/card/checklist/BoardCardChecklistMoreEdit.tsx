import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeCardChecklistTitle from "@/controllers/api/card/checklist/useChangeCardChecklistTitle";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardChecklistMoreEdit({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checklist, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardChecklist();
    const [t] = useTranslation();
    const { mutateAsync: changeChecklistTitleMutateAsync } = useChangeCardChecklistTitle();
    const [isOpened, setIsOpened] = useState(false);
    const title = checklist.useField("title");
    const titleInputRef = useRef<HTMLInputElement>(null);

    const changeChecklistTitle = () => {
        if (isValidating || !titleInputRef.current) {
            return;
        }

        setIsValidating(true);

        const newValue = titleInputRef.current.value.trim();

        if (!newValue) {
            Toast.Add.error(t("card.errors.Checklist title cannot be empty."));
            setIsValidating(false);
            titleInputRef.current.focus();
            return;
        }

        if (newValue === title) {
            setIsValidating(false);
            setIsMoreMenuOpened(false);
            setIsOpened(false);
            return;
        }

        const promise = changeChecklistTitleMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
            title: newValue,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Title changed successfully.");
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
            changeChecklistTitle();
        }
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item onClick={handleClick}>{t("card.Edit title")}</DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Floating.LabelInput label={t("card.Checklist title")} defaultValue={title} onKeyDown={handleKeyDown} ref={titleInputRef} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeChecklistTitle} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardCardChecklistMoreEdit;
