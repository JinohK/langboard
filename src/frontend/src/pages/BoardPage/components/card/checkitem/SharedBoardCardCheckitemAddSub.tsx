import { AssignMemberForm } from "@/components/AssignMemberPopover";
import { Button, DropdownMenu, Flex, Floating, IconComponent, Popover, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useCreateSubCheckitem from "@/controllers/api/card/checkitem/useCreateSubCheckitem";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemAddSub({
    fromDropdown = false,
    setIsMoreMenuOpened = () => {},
}: {
    fromDropdown?: bool;
    setIsMoreMenuOpened?: (value: bool) => void;
}): JSX.Element {
    const { projectUID, card, currentUser, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const { mutateAsync: createSubCheckitemMutateAsync } = useCreateSubCheckitem();
    const titleInputId = `board-card-new-sub-checkitem-title-input-${checkitem.uid}${fromDropdown ? "-dropdown" : ""}`;

    const createSubCheckitem = () => {
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

        const promise = createSubCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
            title,
            assigned_users: selectedMembers.map((id) => parseInt(id)),
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Creating..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Sub-checkitem created successfully.");
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
                {fromDropdown ? (
                    <DropdownMenu.Item
                        className="flex sm:hidden"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpened(true);
                        }}
                    >
                        {t("card.Add sub-checkitem")}
                    </DropdownMenu.Item>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="hidden h-8 w-5 sm:inline-flex sm:size-8"
                        title={t("card.Add sub-checkitem")}
                    >
                        <IconComponent icon="plus" size="4" />
                    </Button>
                )}
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Floating.LabelInput
                    label={t("card.Checkitem title")}
                    id={titleInputId}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            createSubCheckitem();
                        }
                    }}
                />
                <AssignMemberForm
                    multiSelectProps={{
                        placeholder: t("card.Select members..."),
                        className: cn(
                            "mt-2 max-w-[calc(100vw_-_theme(spacing.20))]",
                            "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                            "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                        ),
                        inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
                    }}
                    isValidating={isValidating}
                    allUsers={card.project_members}
                    assignedUsers={[]}
                    currentUser={currentUser}
                    onValueChange={setSelectedMembers}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={createSubCheckitem} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default SharedBoardCardCheckitemAddSub;
