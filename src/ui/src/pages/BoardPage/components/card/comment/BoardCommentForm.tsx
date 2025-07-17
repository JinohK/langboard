import { Box, Button, Drawer, Flex, Form, Skeleton, SubmitButton } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import useAddCardComment from "@/controllers/api/card/comment/useAddCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";
import { BotModel } from "@/core/models";

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
    const { projectUID, card, currentUser, editorsRef, setCurrentEditor, replyRef } = useBoardCard();
    const [t] = useTranslation();
    const projectMembers = card.useForeignField("project_members");
    const bots = BotModel.Model.useModels(() => true);
    const mentionables = useMemo(() => [...projectMembers, ...bots], [projectMembers, bots]);
    const valueRef = useRef<IEditorContent>({ content: "" });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const drawerRef = useRef<HTMLDivElement>(null);
    const editorComponentRef = useRef<HTMLDivElement>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutate: addCommentMutate } = useAddCardComment();
    const editorName = `${card.uid}-comment-form`;
    const isClickedRef = useRef(false);
    const { stopEditing } = useToggleEditingByClickOutside("[data-card-comment-form]", (mode) => {
        if (mode === "view") {
            setCurrentEditor("");
        }
    });
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

    replyRef.current = (target: TUserLikeModel) => {
        if (isValidating) {
            return;
        }

        let username;
        if (isModel(target, "User")) {
            if (!target.isValidUser()) {
                return;
            }

            username = target.username;
        } else if (isModel(target, "BotModel")) {
            username = target.bot_uname;
        } else {
            return;
        }

        if (!isOpened) {
            setCurrentEditor(editorName);
            setIsOpened(true);
        }

        setValue({
            content: `[**@${username}**](${target.uid}) `,
        });

        setTimeout(() => {
            if (editorComponentRef.current) {
                editorComponentRef.current.focus();
            }
        }, 0);
    };

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
            }, 450);
            return;
        }

        setIsOpened(opened);
        setTimeout(() => {
            editorComponentRef.current?.focus();
        }, 0);
    };

    editorsRef.current[editorName] = changeOpenState;

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
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                    setCurrentEditor("");
                    setTimeout(() => {
                        changeOpenState(false);
                    }, 0);
                },
            }
        );
    };

    const clickOutside = (e: React.MouseEvent | CustomEvent) => {
        if (!isOpened) {
            return;
        }

        stopEditing(e);
    };

    return (
        <Form.Root className="sticky bottom-0 z-[100] -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] sm:-bottom-2">
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
                        <UserAvatar.Root userOrBot={currentUser} avatarSize="sm" />
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
                        <Drawer.Handle
                            className="flex h-2 !w-full cursor-grab justify-center !bg-transparent py-3 text-center"
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
                                editorType="card-new-comment"
                                form={{
                                    project_uid: projectUID,
                                    card_uid: card.uid,
                                }}
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
