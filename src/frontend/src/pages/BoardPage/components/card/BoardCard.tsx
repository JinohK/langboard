import { Box, Dialog, Flex, Skeleton, Toast } from "@/components/base";
import useGetCardDetails from "@/controllers/api/card/useGetCardDetails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { BoardCardProvider, useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardCardActionList, { SkeletonBoardCardActionList } from "@/pages/BoardPage/components/card/action/BoardCardActionList";
import BoardCardChecklist, { SkeletonBoardCardChecklist } from "@/pages/BoardPage/components/card/checkitem/BoardCardChecklist";
import BoardCardColumnName, { SkeletonBoardCardColumnName } from "@/pages/BoardPage/components/card/BoardCardColumnName";
import BoardCardDeadline, { SkeletonBoardCardDeadline } from "@/pages/BoardPage/components/card/BoardCardDeadline";
import BoardCardDescription, { SkeletonBoardCardDescription } from "@/pages/BoardPage/components/card/BoardCardDescription";
import BoardCardAttachmentList, { SkeletonBoardCardAttachmentList } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentList";
import BoardCardTitle, { SkeletonBoardCardTitle } from "@/pages/BoardPage/components/card/BoardCardTitle";
import BoardCommentForm, { SkeletonBoardCommentForm } from "@/pages/BoardPage/components/card/comment/BoardCommentForm";
import BoardCommentList, { SkeletonBoardCommentList } from "@/pages/BoardPage/components/card/comment/BoardCommentList";
import { forwardRef, memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BoardCardMemberList from "@/pages/BoardPage/components/card/BoardCardMemberList";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import BoardCardLabelList from "@/pages/BoardPage/components/card/label/BoardCardLabelList";

export interface IBoardCardProps {
    projectUID: string;
    cardUID: string;
    currentUser: IAuthUser;
    viewportId: string;
}

const BoardCard = memo(({ projectUID, cardUID, currentUser, viewportId }: IBoardCardProps): JSX.Element => {
    const { setIsLoadingRef } = usePageLoader();
    const { data: cardData, isFetching, error } = useGetCardDetails({ project_uid: projectUID, card_uid: cardUID });
    const [t] = useTranslation();
    const socket = useSocket();
    const navigate = useRef(usePageNavigate());

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!cardData || isFetching) {
            return;
        }

        setIsLoadingRef.current(false);
        socket.subscribe(ESocketTopic.BoardCard, cardUID);

        return () => {
            socket.unsubscribe(ESocketTopic.BoardCard, cardUID);
        };
    }, [isFetching]);

    return (
        <>
            {!cardData ? (
                <SkeletonBoardCard />
            ) : (
                <BoardCardProvider
                    projectUID={projectUID}
                    card={cardData.card}
                    currentUser={currentUser}
                    currentUserRoleActions={cardData.current_user_role_actions}
                >
                    <BoardCardResult viewportId={viewportId} />
                </BoardCardProvider>
            )}
        </>
    );
});

export function SkeletonBoardCard(): JSX.Element {
    return (
        <>
            <Flex
                direction="col"
                mb="3"
                position="sticky"
                top={{ initial: "0", sm: "-2" }}
                pb="3"
                className="z-[100] space-y-1.5 border-b-2 bg-background text-left"
            >
                <SkeletonBoardCardTitle />
                <Flex gap="3">
                    <Dialog.Description asChild>
                        <SkeletonBoardCardColumnName />
                    </Dialog.Description>
                </Flex>
                <Skeleton position="absolute" right="0" size="6" rounded="sm" className="opacity-70" />
            </Flex>
            <Flex gap="2" direction={{ initial: "col-reverse", sm: "row" }}>
                <Flex direction="col" gap="4" className="sm:w-[calc(100%_-_theme(spacing.32)_-_theme(spacing.2))]">
                    <Flex direction={{ initial: "col", sm: "row" }} gap="4">
                        <BoardCardSection title="card.Members" className="sm:w-1/2" contentClassName="flex gap-1">
                            <SkeletonUserAvatarList count={6} size={{ initial: "sm", lg: "default" }} spacing="none" className="space-x-1" />
                        </BoardCardSection>
                        <BoardCardSection title="card.Deadline" className="sm:w-1/2">
                            <SkeletonBoardCardDeadline />
                        </BoardCardSection>
                    </Flex>
                    <BoardCardSection title="card.Description" className="relative min-h-56">
                        <SkeletonBoardCardDescription />
                    </BoardCardSection>
                    <BoardCardSection title="card.Attached files">
                        <SkeletonBoardCardAttachmentList />
                    </BoardCardSection>
                    <BoardCardSection title="card.Checklist">
                        <SkeletonBoardCardChecklist />
                    </BoardCardSection>
                    <BoardCardSection title="card.Comments">
                        <SkeletonBoardCommentList />
                    </BoardCardSection>
                </Flex>
                <Box w="full" maxW={{ sm: "32" }}>
                    <Box
                        z="10"
                        display="inline-block"
                        w="full"
                        position={{ sm: "sticky" }}
                        className="top-[calc(theme(spacing.16)_+_theme(spacing.3))]"
                    >
                        <BoardCardSection title="card.Actions" titleClassName="mb-2">
                            <SkeletonBoardCardActionList />
                        </BoardCardSection>
                    </Box>
                </Box>
            </Flex>
            <SkeletonBoardCommentForm />
        </>
    );
}

function BoardCardResult({ viewportId }: { viewportId: string }): JSX.Element {
    const { card, setCurrentEditor } = useBoardCard();

    useEffect(() => {
        return () => {
            setCurrentEditor("");
        };
    }, []);

    return (
        <>
            <Dialog.Header className="sticky top-0 z-[100] mb-3 border-b-2 bg-background pb-3 text-left sm:-top-2">
                <BoardCardTitle />
                <Flex gap="3">
                    <Dialog.Description>
                        <BoardCardColumnName />
                    </Dialog.Description>
                    <BoardCardLabelList />
                </Flex>
                <Dialog.CloseButton className="absolute right-0" />
            </Dialog.Header>
            <Flex gap="2" direction={{ initial: "col-reverse", sm: "row" }}>
                <Flex direction="col" gap="4" className="sm:w-[calc(100%_-_theme(spacing.32)_-_theme(spacing.2))]">
                    <Flex direction={{ initial: "col", sm: "row" }} gap="4">
                        <BoardCardSection title="card.Members" className="sm:w-1/2" contentClassName="flex gap-1">
                            <BoardCardMemberList members={card.members} />
                        </BoardCardSection>
                        <BoardCardSection title="card.Deadline" className="sm:w-1/2">
                            <BoardCardDeadline />
                        </BoardCardSection>
                    </Flex>
                    <BoardCardSection title="card.Description" className="relative min-h-56">
                        <BoardCardDescription />
                    </BoardCardSection>
                    {card.attachments.length > 0 && (
                        <BoardCardSection title="card.Attached files">
                            <BoardCardAttachmentList />
                        </BoardCardSection>
                    )}
                    {card.checkitems.length > 0 && (
                        <BoardCardSection title="card.Checklist">
                            <BoardCardChecklist />
                        </BoardCardSection>
                    )}
                    <BoardCardSection title="card.Comments">
                        <BoardCommentList viewportId={viewportId} />
                    </BoardCardSection>
                </Flex>
                <Box w="full" maxW={{ sm: "32" }}>
                    <Box
                        z="10"
                        display="inline-block"
                        w="full"
                        position={{ sm: "sticky" }}
                        className="top-[calc(theme(spacing.16)_+_theme(spacing.3))]"
                    >
                        <BoardCardSection title="card.Actions" titleClassName="mb-2">
                            <BoardCardActionList />
                        </BoardCardSection>
                    </Box>
                </Box>
            </Flex>
            <BoardCommentForm />
        </>
    );
}

interface IBoardCardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    titleClassName?: string;
    contentClassName?: string;
}

const BoardCardSection = forwardRef<HTMLDivElement, IBoardCardSectionProps>(
    ({ title, titleClassName, contentClassName, children, ...props }, ref) => {
        const [t] = useTranslation();
        return (
            <Box {...props} ref={ref}>
                <Box mb="1" className={titleClassName}>
                    {t(title)}
                </Box>
                <Box className={contentClassName}>{children}</Box>
            </Box>
        );
    }
);

export default BoardCard;
