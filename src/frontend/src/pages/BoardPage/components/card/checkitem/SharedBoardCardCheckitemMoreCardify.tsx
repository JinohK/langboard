import { Button, Checkbox, DropdownMenu, Flex, Label, Popover, Select, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useCardifyCheckitem from "@/controllers/api/card/checkitem/useCardifyCheckitem";
import { Project } from "@/core/models";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMoreCardify({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkitem, isParent, isValidating, setIsValidating, sharedErrorHandler, update } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: cardifyCheckitemMutateAsync } = useCardifyCheckitem();
    const [allColumns] = useState(card.project_all_columns.filter((column) => column.uid !== Project.ARCHIVE_COLUMN_UID));
    const [selectedColumnUID, setSelectedColumnUID] = useState<string | undefined>(
        allColumns.some((column) => column.uid === card.column_uid) ? card.column_uid : allColumns[0]?.uid
    );
    const [withSubCheckitems, setWithSubCheckitems] = useState<CheckedState>(true);
    const [withAssignMembers, setWithAssignMembers] = useState<CheckedState>(true);

    const cardify = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = cardifyCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
            column_uid: selectedColumnUID,
            with_sub_checkitems: isParent ? !!withSubCheckitems : undefined,
            with_assign_users: !!withAssignMembers,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: (data) => {
                checkitem.cardified_uid = data.card_uid;
                update();
                return t("card.Cardified the checkitem successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                changeOpenState(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setSelectedColumnUID(card.column_uid !== Project.ARCHIVE_COLUMN_UID ? card.column_uid : card.project_all_columns[0]?.uid);
            setWithSubCheckitems(true);
            setWithAssignMembers(true);
        }

        setIsOpened(opened);
    };

    return (
        <Popover.Root modal={true} open={isOpened} onOpenChange={changeOpenState}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        changeOpenState(true);
                    }}
                >
                    {t("card.Cardify")}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Flex direction="col" gap="2">
                    {allColumns.length > 0 && (
                        <Select.Root value={selectedColumnUID} onValueChange={(value) => setSelectedColumnUID(value)} disabled={isValidating}>
                            <Select.Trigger>
                                <Select.Value placeholder={t("card.Select Column")} />
                            </Select.Trigger>
                            <Select.Content>
                                {allColumns.map((column) => (
                                    <Select.Item value={column.uid} key={`board-card-checkitem-column-${column.uid}`}>
                                        {column.name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    )}
                    {isParent && (
                        <Label display="flex" cursor="pointer" items="center" gap="1">
                            <Checkbox checked={withSubCheckitems} onCheckedChange={setWithSubCheckitems} disabled={isValidating} />
                            {t("card.Cardify with Sub Checkitems")}
                        </Label>
                    )}
                    <Label display="flex" cursor="pointer" items="center" gap="1">
                        <Checkbox checked={withAssignMembers} onCheckedChange={setWithAssignMembers} disabled={isValidating} />
                        {t("card.Cardify with Assign Members")}
                    </Label>
                    <Flex items="center" justify="end" gap="1" mt="2">
                        <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                            {t("common.Cancel")}
                        </Button>
                        <SubmitButton type="button" size="sm" onClick={cardify} isValidating={isValidating}>
                            {t("card.Cardify")}
                        </SubmitButton>
                    </Flex>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default SharedBoardCardCheckitemMoreCardify;
