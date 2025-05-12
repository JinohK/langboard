import { Box, Button, Dialog, IconComponent } from "@/components/base";
import { MetadataList } from "@/components/MetadataList";
import MetadataAddButton from "@/components/MetadataList/MetadataAddButton";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionMetadataProps extends ISharedBoardCardActionProps {}

const BoardCardActionMetadata = memo(({ buttonClassName }: IBoardCardActionMetadataProps) => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const errorsMap = (messageRef: { message: string }) => ({
        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
            messageRef.message = t("errors.Forbidden");
        },
        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
            messageRef.message = t("card.errors.Card not found.");
        },
        nonApiError: () => {
            messageRef.message = t("errors.Unknown error");
        },
        wildcardError: () => {
            messageRef.message = t("errors.Internal server error");
        },
    });

    return (
        <Dialog.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("metadata.Metadata")}
                </Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>{t("metadata.Metadata")}</Dialog.Title>
                <Dialog.Description asChild className="text-base text-primary-foreground">
                    <Box>
                        <MetadataList
                            form={{
                                type: "card",
                                project_uid: projectUID,
                                uid: card.uid,
                            }}
                            errorsMap={errorsMap}
                            canEdit={() => hasRoleAction(Project.ERoleAction.CardUpdate)}
                        />
                    </Box>
                </Dialog.Description>
                {hasRoleAction(Project.ERoleAction.CardUpdate) && (
                    <Dialog.Footer>
                        <MetadataAddButton
                            form={{
                                type: "card",
                                project_uid: projectUID,
                                uid: card.uid,
                            }}
                            errorsMap={errorsMap}
                        />
                    </Dialog.Footer>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
});

export default BoardCardActionMetadata;
