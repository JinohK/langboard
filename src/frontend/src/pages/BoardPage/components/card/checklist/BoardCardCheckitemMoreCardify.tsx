import { Button, DropdownMenu, Flex, Popover, Select, SubmitButton, Toast } from "@/components/base";
import useCardifyCardCheckitem from "@/controllers/api/card/checkitem/useCardifyCardCheckitem";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemMoreCardify({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: cardifyCheckitemMutateAsync } = useCardifyCardCheckitem();
    const [allColumns] = useState(card.project_all_columns.filter((column) => !column.is_archive));
    const [selectedColumnUID, setSelectedColumnUID] = useState<string | undefined>(
        allColumns.some((column) => column.uid === card.column_uid) ? card.column_uid : allColumns[0]?.uid
    );

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
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Cardified the checkitem successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                changeOpenState(false);
            },
        });
    };

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setSelectedColumnUID(!card.archived_at ? card.column_uid : card.project_all_columns[0]?.uid);
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

export default BoardCardCheckitemMoreCardify;
