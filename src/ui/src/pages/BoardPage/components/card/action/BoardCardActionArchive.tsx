import { Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useArchiveCard from "@/controllers/api/card/useArchiveCard";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionArchiveProps extends ISharedBoardCardActionProps {}

const BoardCardActionArchive = memo(({ buttonClassName }: IBoardCardActionArchiveProps) => {
    const { projectUID, card } = useBoardCard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync } = useArchiveCard({ interceptToast: true });

    const archiveCard = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("card.successes.Card archived successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
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
                    <IconComponent icon="archive" size="4" />
                    {t("card.Archive card")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("card.Are you sure you want to archive this card?")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={archiveCard} isValidating={isValidating}>
                        {t("card.Archive")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionArchive;
