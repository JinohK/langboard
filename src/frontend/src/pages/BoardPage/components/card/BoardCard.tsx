import { Dialog, Flex, Toast } from "@/components/base";
import useGetCardDetails from "@/controllers/api/card/useGetCardDetails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAuth } from "@/core/providers/AuthProvider";
import { BoardCardProvider, useBoardCard } from "@/core/providers/BoardCardProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardActionList from "@/pages/BoardPage/components/card/action/BoardCardActionList";
import BoardCardChecklist from "@/pages/BoardPage/components/card/checkitem/BoardCardChecklist";
import BoardCardColumnName from "@/pages/BoardPage/components/card/BoardCardColumnName";
import BoardCardDeadline from "@/pages/BoardPage/components/card/BoardCardDeadline";
import BoardCardDescription from "@/pages/BoardPage/components/card/BoardCardDescription";
import BoardCardAttachmentList from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentList";
import BoardCardTitle from "@/pages/BoardPage/components/card/BoardCardTitle";
import BoardCommentForm from "@/pages/BoardPage/components/card/comment/BoardCommentForm";
import BoardCommentList from "@/pages/BoardPage/components/card/comment/BoardCommentList";
import { forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BoardCardMemberList from "@/pages/BoardPage/components/card/BoardCardMemberList";

export interface IBoardCardProps {
    projectUID: string;
    cardUID: string;
    socket: IConnectedSocket;
}

function BoardCard({ projectUID, cardUID, socket }: IBoardCardProps): JSX.Element {
    const { aboutMe } = useAuth();
    const { data: cardData, error } = useGetCardDetails({ project_uid: projectUID, card_uid: cardUID });
    const [t] = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            {!cardData || !aboutMe() ? (
                "loading..."
            ) : (
                <BoardCardProvider
                    projectUID={projectUID}
                    card={cardData.card}
                    currentUser={aboutMe()!}
                    currentUserRoleActions={cardData.current_user_role_actions}
                    socket={socket}
                >
                    <BoardCardResult />
                </BoardCardProvider>
            )}
        </>
    );
}

function BoardCardResult(): JSX.Element {
    const { projectUID, card, setCurrentEditor } = useBoardCard();
    const navigate = useNavigate();
    const viewportId = `board-card-${card.uid}`;

    const close = () => {
        setCurrentEditor("");
        navigate(ROUTES.BOARD.MAIN(projectUID), {
            state: { isSamePage: true },
        });
    };

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Content
                className="max-w-[100vw] p-4 pb-0 sm:max-w-screen-sm lg:max-w-screen-md"
                aria-describedby=""
                withCloseButton={false}
                viewportId={viewportId}
                data-card-dialog-content
            >
                <Dialog.Header className="sticky top-0 z-[100] mb-3 border-b-2 bg-background pb-3 text-left sm:-top-2">
                    <BoardCardTitle />
                    <Dialog.Description>
                        <BoardCardColumnName />
                    </Dialog.Description>
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
                    <div className="w-full sm:max-w-32">
                        <div className="top-[calc(theme(spacing.16)_+_theme(spacing.3))] z-10 inline-block w-full sm:sticky">
                            <BoardCardSection title="card.Actions" titleClassName="mb-2">
                                <BoardCardActionList />
                            </BoardCardSection>
                        </div>
                    </div>
                </Flex>
                <BoardCommentForm />
            </Dialog.Content>
        </Dialog.Root>
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
            <div {...props} ref={ref}>
                <div className={cn("mb-1", titleClassName)}>{t(title)}</div>
                <div className={contentClassName}>{children}</div>
            </div>
        );
    }
);

export default BoardCard;
