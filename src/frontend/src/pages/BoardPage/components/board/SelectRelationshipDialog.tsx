import { Button, Dialog, Flex, IconComponent, ScrollArea } from "@/components/base";
import { ProjectCard } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface ISelectRelationshipDialogProps {
    card: ProjectCard.TModel;
    isOpened: bool;
    setIsOpened: (isOpened: bool) => void;
}

const SelectRelationshipDialog = memo(({ card, isOpened, setIsOpened }: ISelectRelationshipDialogProps) => {
    const { selectCardViewType, selectedRelationshipUIDs, globalRelationshipTypes, setCardSelection } = useBoardRelationshipController();
    const [t] = useTranslation();
    const [selectedRelationshipUID, setSelectedRelationshipUID] = useState<string | undefined>(
        selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === card.uid)?.[1]
    );
    const isParent = selectCardViewType === "parents";

    useEffect(() => {
        setSelectedRelationshipUID(selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === card.uid)?.[1]);
    }, [selectedRelationshipUIDs]);

    if (!selectCardViewType) {
        return null;
    }

    const changeIsOpened = (isOpened: bool) => {
        if (selectedRelationshipUID && !isOpened) {
            card.isOpenedInBoardColumn = true;
        }
        setCardSelection(card.uid, selectedRelationshipUID);
        setIsOpened(isOpened);
    };

    return (
        <Dialog.Root open={isOpened} onOpenChange={changeIsOpened}>
            <Dialog.Content aria-describedby="" withCloseButton={false} viewportId="select-relationship-dialog">
                <Dialog.Title hidden />
                <Dialog.Description hidden />
                <Flex items="center" justify="between" textSize="base" weight="semibold" className="border-b" pb="3">
                    {card.title}
                </Flex>
                <ScrollArea.Root className="border">
                    <Flex direction="col" position="relative" textSize="sm" className="h-[min(theme(spacing.48),35vh)] select-none">
                        {globalRelationshipTypes.map((relationship) => {
                            const relationshipName = isParent ? relationship.parent_name : relationship.child_name;
                            const relationshipIcon = isParent ? relationship.parent_icon : relationship.child_icon;
                            return (
                                <Button
                                    key={createShortUUID()}
                                    type="button"
                                    variant="ghost"
                                    title={relationshipName}
                                    className={cn(
                                        "justify-start rounded-none border-b p-0",
                                        selectedRelationshipUID === relationship.uid && "bg-accent/70 text-accent-foreground"
                                    )}
                                    onClick={() => {
                                        if (selectedRelationshipUID === relationship.uid) {
                                            setSelectedRelationshipUID(undefined);
                                            return;
                                        }
                                        setSelectedRelationshipUID(relationship.uid);
                                    }}
                                >
                                    <Flex items="center" gap="1" py="1" px="2" className="truncate">
                                        {relationshipIcon && <IconComponent icon={relationshipIcon} size="4" />}
                                        <span className="truncate">{relationshipName}</span>
                                    </Flex>
                                </Button>
                            );
                        })}
                    </Flex>
                </ScrollArea.Root>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" size="sm" onClick={() => changeIsOpened(false)}>
                        {t("common.Save")}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
});

export default SelectRelationshipDialog;
