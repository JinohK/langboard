import { Button, Drawer, Flex, Form } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { IEditorContent } from "@/core/models/Base";
import { createDataText } from "@/components/Editor/plugins/markdown";
import { format } from "@/core/utils/StringUtils";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { User } from "@/core/models";
import { API_ROUTES } from "@/controllers/constants";
import UserAvatarList from "@/components/UserAvatarList";
import { cn } from "@/core/utils/ComponentUtils";
import useAddCardComment from "@/controllers/api/card/comment/useAddCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useCardCommentAddedHandlers from "@/controllers/socket/card/comment/useCardCommentAddedHandlers";
import useCardAttachmentUploadedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentUploadedHandlers";
import SubmitButton from "@/components/SubmitButton";

function BoardCommentForm(): JSX.Element {
    const { projectUID, card, socket, currentUser, setCurrentEditor, replyRef, subscribeEditorSocketEvents } = useBoardCard();
    const [t] = useTranslation();
    const valueRef = useRef<IEditorContent>({ content: "" });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const drawerRef = useRef<HTMLDivElement | null>(null);
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [editingUserIds, setEditingUserIds] = useState<number[]>([]);
    const { mutate: addCommentMutate } = useAddCardComment();
    const editorName = `${card.uid}-comment`;
    const isClickedRef = useRef(false);
    const { send: sendCardCommentAdded } = useCardCommentAddedHandlers({ socket });
    const { send: sendCardAttachmentUploaded } = useCardAttachmentUploadedHandlers({ socket });
    const onDrawerHandlePointerStart = useCallback(
        (type: "mouse" | "touch") => {
            if (isValidating) {
                return;
            }

            const upEvent = type === "mouse" ? "mouseup" : "touchend";

            const checkIsClick = () => {
                isClickedRef.current = true;
                window.removeEventListener(upEvent, checkIsClick);
            };

            window.addEventListener(upEvent, checkIsClick);

            setTimeout(() => {
                if (isClickedRef.current) {
                    changeOpenState(false);
                    return;
                }

                window.removeEventListener(upEvent, checkIsClick);
            }, 250);
        },
        [isValidating, setIsValidating]
    );

    replyRef.current = (targetUser: User.Interface) => {
        if (isValidating) {
            return;
        }

        if (!isOpened) {
            setCurrentEditor(editorName);
            setIsOpened(true);
        }

        setValue({
            content: createDataText("mention", [targetUser.id.toString(), targetUser.username]),
        });

        setTimeout(() => {
            if (editorElementRef.current) {
                editorElementRef.current.focus();
            }
        }, 0);
    };

    useEffect(() => {
        const unsubscribe = subscribeEditorSocketEvents(
            editorName,
            (userIds) => {
                setEditingUserIds(userIds);
            },
            (userIds) => {
                setEditingUserIds(userIds);
            }
        );

        return unsubscribe;
    }, [subscribeEditorSocketEvents]);

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            drawerRef.current?.setAttribute("data-state", "closed");
            setTimeout(() => {
                if (drawerRef.current) {
                    drawerRef.current.style.display = "none";
                }
                setValue({ content: "" });
                setIsOpened(opened);
                setCurrentEditor("");
            }, 450);
            return;
        }

        setIsOpened(opened);
        setCurrentEditor(editorName);
    };

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        addCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                content: valueRef.current,
            },
            {
                onSuccess: (data) => {
                    sendCardCommentAdded({ card_uid: card.uid, comment: data.comment });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                    changeOpenState(false);
                },
            }
        );
    };

    const commentingUsers = editingUserIds.filter((id) => id !== currentUser.id);
    const commentingUsersComp = commentingUsers.length > 0 && (
        <Flex items="center" justify="end" gap="2" mb="1" mr="1">
            <UserAvatarList
                users={commentingUsers.map((userId) => card.project_members.find((user) => user.id === userId) as User.Interface)}
                maxVisible={3}
                size="xs"
                spacing="1"
                listAlign="end"
            />
            <span className="text-muted-foreground/70">{t(`card.${commentingUsers.length === 1 ? "is" : "are"} commenting...`)}</span>
        </Flex>
    );

    const clickOutside = (e: React.MouseEvent | CustomEvent) => {
        if (!isOpened) {
            return;
        }

        const target = e.target as HTMLElement;
        if (
            target.hasAttribute("data-scroll-area-scrollbar") ||
            target.closest("[data-scroll-area-scrollbar]") ||
            target.closest("[data-sonner-toast]") ||
            target.closest("[data-card-comment-form]") ||
            target.closest("[data-radix-popper-content-wrapper") || // Editor's dropdown menu
            target.closest("[data-radix-alert-dialog-content-wrapper]") // Editor's alert dialog
        ) {
            return;
        }

        changeOpenState(false);
    };

    return (
        <Form.Root className="sticky bottom-0 -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] sm:-bottom-2">
            {commentingUsersComp}
            <Drawer.Root modal={false} handleOnly repositionInputs={false} open={isOpened} onOpenChange={changeOpenState}>
                <Drawer.Trigger asChild>
                    <Flex items="center" gap="4" className="rounded-b-lg border-t bg-background p-2">
                        <UserAvatar.Root user={currentUser} avatarSize="sm" />
                        <div className="w-full cursor-text py-1">
                            {t("card.Add a comment as {firstname} {lastname}", { firstname: currentUser.firstname, lastname: currentUser.lastname })}
                        </div>
                    </Flex>
                </Drawer.Trigger>
                <Drawer.Content
                    withGrabber={false}
                    className="rounded-t-none border-none bg-transparent"
                    aria-describedby=""
                    focusGuards={false}
                    onPointerDownOutside={clickOutside}
                    onClick={clickOutside}
                    ref={drawerRef}
                >
                    <Drawer.Title hidden />
                    <Flex
                        direction="col"
                        className={cn(
                            "relative mx-auto w-full max-w-[100vw] rounded-t-[10px] border bg-background pt-4 sm:max-w-screen-sm lg:max-w-screen-md"
                        )}
                        data-card-comment-form
                    >
                        <div className="absolute -top-8 right-0">{commentingUsersComp}</div>
                        <Drawer.Handle
                            className="flex h-2 w-full cursor-grab justify-center bg-transparent py-3 text-center"
                            onMouseDown={() => onDrawerHandlePointerStart("mouse")}
                            onTouchStart={() => onDrawerHandlePointerStart("touch")}
                        >
                            <div className="inline-block h-2 w-[100px] rounded-full bg-muted" />
                        </Drawer.Handle>
                        <div className="relative w-full border-b">
                            <PlateEditor
                                value={valueRef.current}
                                currentUser={currentUser}
                                mentionableUsers={card.project_members}
                                className="h-full max-h-[min(50vh,200px)] min-h-[min(50vh,200px)] overflow-y-auto px-6 py-3"
                                socket={socket}
                                baseSocketEvent="card"
                                uploadPath={format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: projectUID, card_uid: card.uid })}
                                uploadedCallback={(data) => {
                                    sendCardAttachmentUploaded({
                                        card_uid: card.uid,
                                        attachment_uid: data.uid,
                                        attachment: data,
                                    });
                                }}
                                setValue={setValue}
                                editorElementRef={editorElementRef}
                            />
                        </div>
                        <Flex items="center" gap="2" justify="start" p="1">
                            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                                {t("common.Save")}
                            </SubmitButton>
                            <Button variant="secondary" onClick={() => changeOpenState(false)} disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                        </Flex>
                    </Flex>
                </Drawer.Content>
            </Drawer.Root>
        </Form.Root>
    );
}

export default BoardCommentForm;
