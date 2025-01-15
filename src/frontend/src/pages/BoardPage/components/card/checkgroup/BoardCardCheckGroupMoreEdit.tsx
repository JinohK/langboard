import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeCardCheckGroupTitle from "@/controllers/api/card/checkgroup/useChangeCardCheckGroupTitle";
import { useBoardCardCheckGroup } from "@/core/providers/BoardCardCheckGroupProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardCheckGroupMoreEdit({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkGroup, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckGroup();
    const [t] = useTranslation();
    const { mutateAsync: changeCheckGroupTitleMutateAsync } = useChangeCardCheckGroupTitle();
    const [isOpened, setIsOpened] = useState(false);
    const title = checkGroup.useField("title");
    const titleInputRef = useRef<HTMLInputElement>(null);

    const changeCheckGroupTitle = () => {
        if (isValidating || !titleInputRef.current) {
            return;
        }

        setIsValidating(true);

        const newValue = titleInputRef.current.value.trim();

        if (!newValue) {
            Toast.Add.error(t("card.errors.Check group title cannot be empty."));
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

        const promise = changeCheckGroupTitleMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            check_group_uid: checkGroup.uid,
            title: newValue,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
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
                    label={t("card.Check group title")}
                    defaultValue={title}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            changeCheckGroupTitle();
                        }
                    }}
                    ref={titleInputRef}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeCheckGroupTitle} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardCardCheckGroupMoreEdit;
