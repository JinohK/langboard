import { Button, Drawer, Flex, Form } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { IEditorContent } from "@/core/models/Base";
import { createDataText } from "@/components/Editor/plugins/markdown";
import { format } from "@/core/utils/StringUtils";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { User } from "@/core/models";
import { API_ROUTES, SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import UserAvatarList from "@/components/UserAvatarList";
import { cn } from "@/core/utils/ComponentUtils";

function BoardCommentForm(): JSX.Element {
    const { projectUID, card, socket, currentUser, setCurrentEditor, replyRef, subscribeEditorSocketEvents } = useBoardCard();
    const [t] = useTranslation();
    const valueRef = useRef<IEditorContent>({ content: "" });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [usersEditing, setUsersEditing] = useState<number[]>([]);

    replyRef.current = (targetUser: User.Interface) => {
        if (!isOpened) {
            setCurrentEditor(card.uid);
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
            card.uid,
            (userIds) => {
                setUsersEditing(userIds);
            },
            (userIds) => {
                setUsersEditing(userIds);
            }
        );

        return unsubscribe;
    }, [subscribeEditorSocketEvents]);

    const changeOpenState = (opened: bool) => {
        if (!opened) {
            setValue({ content: "" });
        }
        setIsOpened(opened);
        setCurrentEditor(opened ? card.uid : "");
    };

    const commentingUsers = usersEditing.filter((id) => id !== currentUser.id);
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

    return (
        <Form.Root className="sticky -bottom-2 -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))]">
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
                <Drawer.Content withGrabber={false} className="rounded-t-none border-none bg-transparent" aria-describedby="">
                    <Drawer.Title hidden />
                    <Flex
                        direction="col"
                        className={cn(
                            "relative mx-auto w-full max-w-[100vw] rounded-t-[10px] border bg-background pt-4 sm:max-w-screen-sm lg:max-w-screen-md"
                        )}
                    >
                        <div className="absolute -top-8 right-0">{commentingUsersComp}</div>
                        <Drawer.Handle className="flex h-2 w-full cursor-grab justify-center bg-transparent py-3 text-center">
                            <div className="inline-block h-2 w-[100px] rounded-full bg-muted" />
                        </Drawer.Handle>
                        <div className="relative w-full border-b">
                            <PlateEditor
                                value={valueRef.current}
                                currentUser={currentUser}
                                mentionableUsers={card.project_members}
                                className="h-full max-h-[min(70vh,300px)] min-h-[min(70vh,300px)] overflow-y-auto px-6 py-3"
                                socket={socket}
                                baseSocketEvent={SOCKET_CLIENT_EVENTS.BOARD.CARD.BASE_EDITOR}
                                uploadPath={format(API_ROUTES.BOARD.CARD.UPLOAD_ATTACHMENT, { uid: projectUID, card_uid: card.uid })}
                                setValue={setValue}
                                editorElementRef={editorElementRef}
                            />
                        </div>
                        <Flex items="center" gap="2" justify="start" p="1">
                            <Button variant="default">{t("common.Save")}</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    changeOpenState(false);
                                }}
                            >
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
