import { Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useUpdateCardLabels from "@/controllers/api/card/useUpdateCardLabels";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardActionLabelList from "@/pages/BoardPage/components/card/action/label/BoardCardActionLabelList";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionSetLabelProps extends ISharedBoardCardActionProps {}

const BoardCardActionSetLabel = memo(({ buttonClassName }: IBoardCardActionSetLabelProps) => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateCardLabelsMutateAsync } = useUpdateCardLabels();
    const [selectedLabelUIDs, setSelectedLabelUIDs] = useState(card.labels.map((label) => label.uid));

    if (!hasRoleAction(Project.ERoleAction.CardUpdate)) {
        return null;
    }

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setSelectedLabelUIDs(card.labels.map((label) => label.uid));
        }
        setIsOpened(opened);
    };

    const updateLabels = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = updateCardLabelsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            labels: selectedLabelUIDs,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("card.errors.Card not found.");
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                return t("card.successes.Labels updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Popover.Root
            modal
            open={isOpened}
            onOpenChange={(opened) => {
                if (isValidating) {
                    return;
                }
                changeOpenedState(opened);
            }}
        >
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("card.Set label")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-[min(theme(spacing.72),80vw)]">
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Set label")}
                </Box>
                <BoardCardActionLabelList selectedLabelUIDs={selectedLabelUIDs} setSelectedLabelUIDs={setSelectedLabelUIDs} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => changeOpenedState(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={updateLabels} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionSetLabel;
