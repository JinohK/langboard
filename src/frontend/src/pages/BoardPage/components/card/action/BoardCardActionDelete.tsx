import { Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteCard from "@/controllers/api/card/useDeleteCard";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { deleteCardModel } from "@/core/helpers/ModelHelper";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionDeleteProps extends ISharedBoardCardActionProps {}

const BoardCardActionDelete = memo(({ buttonClassName }: IBoardCardActionDeleteProps) => {
    const { setIsLoadingRef } = usePageHeader();
    const { projectUID, card } = useBoardCard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const navigateRef = useRef(usePageNavigate());
    const { mutateAsync } = useDeleteCard();

    const deleteCard = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("card.errors.Card not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                setTimeout(() => {
                    navigateRef.current(ROUTES.BOARD.MAIN(projectUID), { replace: true });
                    setTimeout(() => {
                        setIsLoadingRef.current(false);
                    }, 0);
                }, 0);
                return t("card.successes.Card deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
                deleteCardModel(card.uid, true);
            },
        });
    };

    const changeOpenState = (state: bool) => {
        if (isValidating) {
            return;
        }

        setIsOpened(state);
    };

    return (
        <Popover.Root open={isOpened} onOpenChange={changeOpenState}>
            <Popover.Trigger asChild>
                <Button variant="destructive" className={buttonClassName}>
                    <IconComponent icon="x" size="4" />
                    {t("card.Delete card")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("card.Are you sure you want to delete this card?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("card.All data will be lost.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("card.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteCard} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionDelete;
