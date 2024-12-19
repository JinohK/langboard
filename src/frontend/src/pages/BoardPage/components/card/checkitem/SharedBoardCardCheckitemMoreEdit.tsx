import { Button, DropdownMenu, Flex, Floating, Popover, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useChangeCheckitemTitle from "@/controllers/api/card/checkitem/useChangeCheckitemTitle";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMoreEdit({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: changeCheckitemTitleMutateAsync } = useChangeCheckitemTitle();
    const titleInputId = `board-card-checkitem-title-input-${checkitem.uid}`;

    const changeCheckitemTitle = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const titleInput = document.getElementById(titleInputId) as HTMLInputElement;
        const title = titleInput.value.trim();

        if (!title) {
            Toast.Add.error(t("card.errors.Checkitem title cannot be empty."));
            setIsValidating(false);
            titleInput.focus();
            return;
        }

        const promise = changeCheckitemTitleMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
            title,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                checkitem.title = title;
                return t("card.successes.Title changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpened(true);
                    }}
                >
                    {t("card.Edit title")}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Floating.LabelInput
                    label={t("card.Checkitem title")}
                    id={titleInputId}
                    defaultValue={checkitem.title}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            changeCheckitemTitle();
                        }
                    }}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeCheckitemTitle} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default SharedBoardCardCheckitemMoreEdit;
