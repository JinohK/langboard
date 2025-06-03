import { Box, Button, Flex, IconComponent, Popover, Toast } from "@/components/base";
import useUpdateCardRelationships from "@/controllers/api/card/useUpdateCardRelationships";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectCardRelationship } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardActionRelationshipList from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationshipList";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionRelationshipButtonProps extends ISharedBoardCardActionProps {
    type: ProjectCardRelationship.TRelationship;
    relationships: ProjectCardRelationship.TModel[];
}

function BoardCardActionRelationshipButton({ type, relationships, buttonClassName }: IBoardCardActionRelationshipButtonProps) {
    const {
        selectCardViewType,
        disabledCardSelectionUIDsRef,
        setSelectedRelationshipCardUIDs,
        startCardSelection,
        filterRelationships,
        filterRelatedCardUIDs,
    } = useBoardRelationshipController();
    const { projectUID, card } = useBoardCard();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateCardRelationshipsMutateAsync } = useUpdateCardRelationships();
    const [t] = useTranslation();
    const isParent = type === "parents";

    const saveRelationship = (newRelationships: [string, string][]) => {
        setIsOpened(true);
        setIsValidating(true);

        const promise = updateCardRelationshipsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            is_parent: isParent,
            relationships: newRelationships,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("card.successes.Relationships updated successfully.");
            },
            finally: () => {
                setIsValidating(() => false);
            },
        });
    };

    const selectRelationship = () => {
        setSelectedRelationshipCardUIDs(
            filterRelationships(card.uid, relationships, isParent).map((relationship) => [
                isParent ? relationship.parent_card_uid : relationship.child_card_uid,
                relationship.relationship_type_uid,
            ])
        );
        disabledCardSelectionUIDsRef.current = filterRelatedCardUIDs(card.uid, relationships, !isParent);
        startCardSelection({
            type,
            currentUID: card.uid,
            saveCallback: saveRelationship,
            cancelCallback: () => setIsOpened(true),
        });
    };

    const title = t(`card.${type === "parents" ? "Parent" : "Child"} cards`);

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button
                    type="button"
                    variant={{ initial: "secondary", sm: "default" }}
                    size="icon"
                    title={title}
                    className={cn(
                        buttonClassName,
                        "transition-transform duration-200 sm:fixed sm:top-1/2 sm:size-10 sm:-translate-y-1/2 sm:rounded-full",
                        isParent && "sm:left-[calc(50vw_-_(theme(screens.sm)_/_2)_-_theme(spacing.6))]",
                        isParent && "lg:left-[calc(50vw_-_(theme(screens.md)_/_2)_-_theme(spacing.6))]",
                        !isParent && "sm:right-[calc(50vw_-_(theme(screens.sm)_/_2)_-_theme(spacing.6))]",
                        !isParent && "lg:right-[calc(50vw_-_(theme(screens.md)_/_2)_-_theme(spacing.6))]"
                    )}
                >
                    <IconComponent icon="git-fork" className={cn("size-4 sm:size-6", isParent ? "" : "rotate-180")} />
                    <Box display={{ sm: "hidden" }}>{title}</Box>
                </Button>
            </Popover.Trigger>
            <Popover.Content className="p-0" hidden={!!selectCardViewType}>
                <Flex items="center" justify="between" textSize="base" weight="semibold" className="border-b" pl="4" mr="1" py="1">
                    {title}
                    <Button variant="ghost" size="icon-sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        <IconComponent icon="x" size="5" />
                    </Button>
                </Flex>
                <Box pb="3" pt="2" px="4">
                    <BoardCardActionRelationshipList type={type} relationships={relationships} />
                    <Flex items="center" justify="end" gap="1" mt="2">
                        <Button type="button" size="sm" disabled={isValidating} onClick={selectRelationship}>
                            {t("card.Select cards")}
                        </Button>
                    </Flex>
                </Box>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardCardActionRelationshipButton;
