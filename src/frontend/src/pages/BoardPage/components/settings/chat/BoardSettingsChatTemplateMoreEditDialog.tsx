import { Button, Dialog, DropdownMenu, Flex, Input, SubmitButton, Textarea, Toast } from "@/components/base";
import useUpdateProjectChatTemplate from "@/controllers/api/board/chat/useUpdateProjectChatTemplate";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsChatTemplateRelatedProps } from "@/pages/BoardPage/components/settings/chat/types";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsChatTemplateMoreEditDialogProps extends IBoardSettingsChatTemplateRelatedProps {}

function BoardSettingsChatTemplateMoreEditDialog({ chatTemplate, setIsMoreMenuOpened }: IBoardSettingsChatTemplateMoreEditDialogProps) {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const name = chatTemplate.useField("name");
    const template = chatTemplate.useField("template");
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLTextAreaElement>(null);
    const { mutateAsync: updateChatTemplateMutateAsync } = useUpdateProjectChatTemplate();

    const editChatTemplate = async () => {
        if (isValidating || !nameInputRef.current || !templateInputRef.current) {
            return;
        }

        setIsValidating(true);

        if (!nameInputRef.current.value.trim()) {
            nameInputRef.current.focus();
            setIsValidating(false);
            return;
        }

        if (!templateInputRef.current.value.trim()) {
            templateInputRef.current.focus();
            setIsValidating(false);
            return;
        }

        const newName = nameInputRef.current.value.trim();
        const newTemplate = templateInputRef.current.value.trim();

        const promise = updateChatTemplateMutateAsync({
            project_uid: project.uid,
            template_uid: chatTemplate.uid,
            name: newName,
            template: newTemplate,
        });

        Toast.Add.promise(promise, {
            loading: t("project.settings.Updating..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Chat template updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
                setIsMoreMenuOpened(false);
            },
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    return (
        <Dialog.Root open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Trigger asChild>
                <DropdownMenu.Item onClick={handleClick}>{t("common.Edit")}</DropdownMenu.Item>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title hidden />
                <Dialog.Description hidden />
                <Flex direction="col" gap="2">
                    <Input placeholder={t("project.settings.Template name")} defaultValue={name} ref={nameInputRef} />
                    <Textarea
                        placeholder={t("project.settings.Template")}
                        defaultValue={template}
                        resize="none"
                        className="h-48"
                        ref={templateInputRef}
                    />
                </Flex>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={editChatTemplate} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardSettingsChatTemplateMoreEditDialog;
