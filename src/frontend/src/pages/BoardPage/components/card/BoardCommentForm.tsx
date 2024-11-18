import "@toast-ui/editor/dist/toastui-editor.css";
import "@/assets/styles/editor.scss";
import "prismjs/themes/prism.css";
import { Drawer, Flex, Form } from "@/components/base";
import { Editor } from "@toast-ui/react-editor";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import umlPlugin from "@toast-ui/editor-plugin-uml";
import Prism from "prismjs";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";

export interface IBoardCommentFormProps extends IBaseCardRelatedComponentProps {}

function BoardCommentForm({ currentUser }: IBaseCardRelatedComponentProps): JSX.Element {
    const [t] = useTranslation();

    return (
        <Form.Root className="sticky -bottom-2 -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))]">
            <Drawer.Root modal={false} handleOnly>
                <Drawer.Trigger asChild>
                    <Flex items="center" gap="4" className="border-t bg-background p-2">
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
                        className="max-w-screen mx-auto w-full rounded-t-[10px] border bg-background pt-4 sm:max-w-screen-sm lg:max-w-screen-md"
                    >
                        <Drawer.Handle className="flex h-2 w-full justify-center bg-transparent py-3 text-center">
                            <div className="inline-block h-2 w-[100px] rounded-full bg-muted" />
                        </Drawer.Handle>
                        <div className="-ml-[1px] w-[calc(100%_+_2px)]">
                            <Editor
                                initialEditType="markdown"
                                initialValue=" "
                                hideModeSwitch={true}
                                useCommandShortcut={true}
                                usageStatistics={false}
                                linkAttributes={{
                                    target: "_blank",
                                }}
                                autofocus={false}
                                extendedAutolinks={true}
                                previewStyle="vertical"
                                plugins={[umlPlugin, colorSyntax, [codeSyntaxHighlight, { highlighter: Prism }]]}
                            />
                        </div>
                    </Flex>
                </Drawer.Content>
            </Drawer.Root>
        </Form.Root>
    );
}

export default BoardCommentForm;
