import { Toast } from "@/components/base";
import useUpdateProjectAssignedBots from "@/controllers/api/board/settings/useUpdateProjectAssignedBots";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";

const BoardSettingsBots = memo(() => {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { project, allBots } = useBoardSettings();
    const projectBots = project.useForeignField<BotModel.TModel>("bots");
    const { mutateAsync } = useUpdateProjectAssignedBots();
    const [readOnly, setReadOnly] = useState(true);

    const save = async (selectedBots: BotModel.TModel[]) => {
        if (readOnly) {
            setReadOnly(false);
            return;
        }

        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            uid: project.uid,
            assigned_bots: selectedBots.map((bot) => bot.uid),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("project.errors.Project not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Assigned bots updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setReadOnly(true);
            },
        });
    };

    return (
        <MultiSelectAssignee.Form
            allSelectables={allBots}
            originalAssignees={projectBots}
            createSearchText={((item: BotModel.TModel) => `${item.uid} ${item.name} ${item.bot_uname}`) as IFormProps["createSearchText"]}
            createLabel={((item: BotModel.TModel) => `${item.name} (${item.bot_uname})`) as IFormProps["createLabel"]}
            placeholder={t("project.settings.Add a bot...")}
            useEditorProps={{
                canAddNew: false,
                useButton: true,
                isValidating,
                readOnly,
                setReadOnly,
                save: save as TSaveHandler,
            }}
        />
    );
});

export default BoardSettingsBots;
