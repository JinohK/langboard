import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeCardCheckitemTitle from "@/controllers/api/card/checkitem/useChangeCardCheckitemTitle";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemMoreEdit({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const { mutateAsync: changeCheckitemTitleMutateAsync } = useChangeCardCheckitemTitle();
    const [isOpened, setIsOpened] = useState(false);
    const title = checkitem.useField("title");
    const titleInputRef = useRef<HTMLInputElement>(null);

    const changeCheckitemTitle = () => {
        if (isValidating || !titleInputRef.current) {
            return;
        }

        setIsValidating(true);

        const newValue = titleInputRef.current.value.trim();

        if (!newValue) {
            Toast.Add.error(t("card.errors.Checkitem title cannot be empty."));
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

        const promise = changeCheckitemTitleMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
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
                    defaultValue={title}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            changeCheckitemTitle();
                        }
                    }}
                    ref={titleInputRef}
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

export default BoardCardCheckitemMoreEdit;
