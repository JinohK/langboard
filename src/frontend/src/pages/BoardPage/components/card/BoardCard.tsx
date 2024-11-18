import { Button, Dialog, Flex, IconComponent, DateTimePicker, Toast } from "@/components/base";
import Markdown from "@/components/Markdown";
import UserAvatarList from "@/components/UserAvatarList";
import useGetCardDetails from "@/controllers/board/useGetCardDetails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAuth } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardChecklist from "@/pages/BoardPage/components/card/BoardCardChecklist";
import BoardCardFileList from "@/pages/BoardPage/components/card/BoardCardFileList";
import BoardCommentForm from "@/pages/BoardPage/components/card/BoardCommentForm";
import BoardCommentList from "@/pages/BoardPage/components/card/BoardCommentList";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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
                <BoardCardResult
                    socket={socket}
                    projectUID={projectUID}
                    card={cardData.card}
                    currentUserRoleActions={cardData.current_user_role_actions}
                    currentUser={aboutMe()!}
                />
            )}
        </>
    );
}

interface IBoardCardResultProps extends IBaseCardRelatedComponentProps {}

function BoardCardResult({ projectUID, card, currentUserRoleActions, currentUser, socket }: IBoardCardResultProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const [deadline, setDeadline] = useState<Date | undefined>(card.deadline_at);
    const viewportId = `board-card-${card.uid}`;

    const close = () => {
        navigate(ROUTES.BOARD.MAIN(projectUID));
    };

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Content
                className="max-w-screen p-4 sm:max-w-screen-sm lg:max-w-screen-md"
                aria-describedby=""
                withCloseButton={false}
                viewportId={viewportId}
            >
                <Dialog.Header className="sticky -top-2 z-10 mb-3 border-b-2 bg-background pb-3">
                    <Dialog.Title className="pr-7 sm:text-2xl">{card.title}</Dialog.Title>
                    <Dialog.Description>{card.column_name}</Dialog.Description>
                    <Dialog.CloseButton className="absolute right-0" />
                </Dialog.Header>
                <Flex direction="col" gap="4">
                    <Flex direction={{ initial: "col", sm: "row" }} gap="4">
                        <BoardCardSection title="card.Members" className="sm:w-1/2" contentClassName="flex gap-1">
                            {card.members.length > 0 && (
                                <UserAvatarList
                                    users={card.members}
                                    maxVisible={6}
                                    spacing="none"
                                    size={{ initial: "sm", sm: "default" }}
                                    className="space-x-1"
                                />
                            )}
                            <Button variant="outline" size="icon" className="size-8 sm:size-10" title={t("card.Add members")}>
                                <IconComponent icon="plus" size="6" />
                            </Button>
                        </BoardCardSection>
                        <BoardCardSection title="card.Deadline" className="sm:w-1/2">
                            <DateTimePicker
                                value={deadline}
                                min={new Date()}
                                onChange={(date) => {
                                    setDeadline(date);
                                }}
                                renderTrigger={() => (
                                    <Button variant={deadline ? "default" : "outline"} className="h-8 gap-2 sm:h-10" title={t("card.Set deadline")}>
                                        <IconComponent icon="calendar" size="4" />
                                        {deadline?.toLocaleString() ?? t("card.Set deadline")}
                                    </Button>
                                )}
                            />
                        </BoardCardSection>
                    </Flex>
                    <BoardCardSection title="card.Description" className="relative min-h-56">
                        {card.description ? (
                            <Markdown>{card.description}</Markdown>
                        ) : (
                            <span className="absolute top-1/2 mt-4 -translate-y-1/2 text-muted-foreground">{t("card.No description")}</span>
                        )}
                    </BoardCardSection>
                    {card.files.length > 0 && (
                        <BoardCardSection title="card.Attached files">
                            <BoardCardFileList
                                projectUID={projectUID}
                                card={card}
                                currentUser={currentUser}
                                currentUserRoleActions={currentUserRoleActions}
                                socket={socket}
                                files={card.files}
                            />
                        </BoardCardSection>
                    )}
                    {card.checkitems.length > 0 && (
                        <BoardCardSection title="card.Checklist">
                            <BoardCardChecklist
                                projectUID={projectUID}
                                card={card}
                                currentUser={currentUser}
                                currentUserRoleActions={currentUserRoleActions}
                                socket={socket}
                            />
                        </BoardCardSection>
                    )}
                    <BoardCardSection title="card.Comments">
                        <BoardCommentList
                            projectUID={projectUID}
                            card={card}
                            currentUser={currentUser}
                            currentUserRoleActions={currentUserRoleActions}
                            socket={socket}
                            viewportId={viewportId}
                        />
                    </BoardCardSection>
                    <BoardCommentForm
                        projectUID={projectUID}
                        card={card}
                        currentUser={currentUser}
                        currentUserRoleActions={currentUserRoleActions}
                        socket={socket}
                    />
                </Flex>
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
