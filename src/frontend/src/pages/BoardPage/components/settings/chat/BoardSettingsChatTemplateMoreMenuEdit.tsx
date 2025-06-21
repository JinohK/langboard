import { Flex, Input, Textarea, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useUpdateProjectChatTemplate from "@/controllers/api/board/chat/useUpdateProjectChatTemplate";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsChatTemplateMoreMenuEdit() {
    const { project } = useBoardSettings();
    const { model: chatTemplate } = ModelRegistry.ChatTemplateModel.useContext();
    const [t] = useTranslation();
    const name = chatTemplate.useField("name");
    const template = chatTemplate.useField("template");
    const nameInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLTextAreaElement>(null);
    const { mutateAsync: updateChatTemplateMutateAsync } = useUpdateProjectChatTemplate({ interceptToast: true });

    const editChatTemplate = async (endCallback: (shouldClose: bool) => void) => {
        if (!nameInputRef.current || !templateInputRef.current) {
            endCallback(false);
            return;
        }

        if (!nameInputRef.current.value.trim()) {
            nameInputRef.current.focus();
            endCallback(false);
            return;
        }

        if (!templateInputRef.current.value.trim()) {
            templateInputRef.current.focus();
            endCallback(false);
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
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Chat template updated successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.DialogItem menuName={t("common.Edit")} onSave={editChatTemplate}>
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
        </MoreMenu.DialogItem>
    );
}

export default BoardSettingsChatTemplateMoreMenuEdit;
