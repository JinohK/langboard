import { Box, Button, Drawer, Flex, Form, Skeleton, SubmitButton } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { IEditorContent } from "@/core/models/Base";
import { createDataText } from "@/components/Editor/plugins/markdown";
import { format } from "@/core/utils/StringUtils";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { BotModel, User } from "@/core/models";
import { API_ROUTES } from "@/controllers/constants";
import { UserAvatarList } from "@/components/UserAvatarList";
import useAddCardComment from "@/controllers/api/card/comment/useAddCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useStopEditingClickOutside from "@/core/hooks/useStopEditingClickOutside";

export function SkeletonBoardCommentForm() {
    return (
        <Box
            position="sticky"
            bottom={{ initial: "0", sm: "-2" }}
            className="-ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] bg-background"
        >
            <Flex items="center" gap="4" p="2" className="rounded-b-lg border-t">
                <Skeleton size="8" rounded="full" className="overflow-hidden" />
                <Box w="full" cursor="text" py="1">
                    <Skeleton h="6" className="w-1/3" />
                </Box>
            </Flex>
        </Box>
    );
}

const BoardCommentForm = memo((): JSX.Element => {
    const { projectUID, card, socket, currentUser, editorsRef, setCurrentEditor, replyRef, subscribeEditorSocketEvents } = useBoardCard();
    const [t] = useTranslation();
    const projectMembers = card.useForeignField<User.TModel>("project_members");
    const projectBots = card.useForeignField<BotModel.TModel>("project_bots");
    const mentionables = useMemo(() => [...projectMembers, ...projectBots.map((bot) => bot.as_user)], [projectMembers, projectBots]);
    const valueRef = useRef<IEditorContent>({ content: "" });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const drawerRef = useRef<HTMLDivElement>(null);
    const editorComponentRef = useRef<HTMLDivElement>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const [editingUserUIDs, setEditingUserUIDs] = useState<string[]>([]);
    const { mutate: addCommentMutate } = useAddCardComment();
    const editorName = `${card.uid}-comment`;
    const isClickedRef = useRef(false);
    const { stopEditing } = useStopEditingClickOutside("[data-card-comment-form]", () => setCurrentEditor(""));
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
                    setCurrentEditor("");
                    return;
                }

                window.removeEventListener(upEvent, checkIsClick);
            }, 250);
        },
        [isValidating, setIsValidating]
    );

    replyRef.current = (targetUser: User.TModel) => {
        if (isValidating || !targetUser.isValidUser()) {
            return;
        }

        if (!isOpened) {
            setCurrentEditor(editorName);
            setIsOpened(true);
        }

        setValue({
            content: createDataText("mention", [targetUser.uid, targetUser.username]),
        });

        setTimeout(() => {
            if (editorComponentRef.current) {
                editorComponentRef.current.focus();
            }
        }, 0);
    };

    useEffect(() => {
        const unsubscribe = subscribeEditorSocketEvents(
            editorName,
            (userUIDs) => {
                setEditingUserUIDs(userUIDs);
            },
            (userUIDs) => {
                setEditingUserUIDs(userUIDs);
            }
        );

        return unsubscribe;
    }, [subscribeEditorSocketEvents]);

    const changeOpenState = (opened: bool) => {
        if (isValidatingRef.current) {
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
            }, 450);
            return;
        }

        setIsOpened(opened);
    };

    editorsRef.current[editorName] = changeOpenState;

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        addCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                content: valueRef.current,
            },
            {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                    isValidatingRef.current = false;
                    setCurrentEditor("");
                },
            }
        );
    };

    const commentingUsers = editingUserUIDs.filter((uid) => uid !== currentUser.uid);
    const commentingUsersElement = commentingUsers.length > 0 && (
        <Flex items="center" justify="end" gap="2" mb="1" mr="1">
            <UserAvatarList
                users={commentingUsers.map((userUID) => card.project_members.find((user) => user.uid === userUID)!)}
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

        stopEditing(e);
    };

    return (
        <Form.Root className="sticky bottom-0 -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] sm:-bottom-2">
            {commentingUsersElement}
            <Drawer.Root
                modal={false}
                handleOnly
                repositionInputs={false}
                open={isOpened}
                onOpenChange={(opened: bool) => {
                    if (opened) {
                        setCurrentEditor(editorName);
                    } else {
                        setCurrentEditor("");
                    }
                }}
            >
                <Drawer.Trigger asChild>
                    <Flex items="center" gap="4" p="2" className="rounded-b-lg border-t bg-background">
                        <UserAvatar.Root user={currentUser as User.TModel} avatarSize="sm" />
                        <Box w="full" cursor="text" py="1">
                            {t("card.Add a comment as {firstname} {lastname}", { firstname: currentUser.firstname, lastname: currentUser.lastname })}
                        </Box>
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
                        position="relative"
                        mx="auto"
                        w="full"
                        pt="4"
                        border
                        className="max-w-[100vw] rounded-t-[10px] bg-background sm:max-w-screen-sm lg:max-w-screen-md"
                        data-card-comment-form
                    >
                        <Box position="absolute" right="0" className="-top-8">
                            {commentingUsersElement}
                        </Box>
                        <Drawer.Handle
                            className="flex h-2 w-full cursor-grab justify-center bg-transparent py-3 text-center"
                            onMouseDown={() => onDrawerHandlePointerStart("mouse")}
                            onTouchStart={() => onDrawerHandlePointerStart("touch")}
                        >
                            <Box display="inline-block" h="2" rounded="full" className="w-[100px] bg-muted" />
                        </Drawer.Handle>
                        <Box position="relative" w="full" className="border-b">
                            <PlateEditor
                                value={valueRef.current}
                                currentUser={currentUser}
                                mentionables={mentionables}
                                className="h-full max-h-[min(50vh,200px)] min-h-[min(50vh,200px)] overflow-y-auto px-6 py-3"
                                socket={socket}
                                baseSocketEvent="board:card"
                                chatEventKey={`card-new-comment-${card.uid}`}
                                copilotEventKey={`card-new-comment-${card.uid}`}
                                uploadPath={format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: projectUID, card_uid: card.uid })}
                                setValue={setValue}
                                editorComponentRef={editorComponentRef}
                            />
                        </Box>
                        <Flex items="center" gap="2" justify="start" p="1">
                            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                                {t("common.Save")}
                            </SubmitButton>
                            <Button variant="secondary" onClick={() => setCurrentEditor("")} disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                        </Flex>
                    </Flex>
                </Drawer.Content>
            </Drawer.Root>
        </Form.Root>
    );
});

export default BoardCommentForm;
