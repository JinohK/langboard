import { Box, Toast } from "@/components/base";
import { MultiSelectAssigneesForm, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import useUpdateProjectAssignedBots from "@/controllers/api/board/settings/useUpdateProjectAssignedBots";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsBots = memo(() => {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { project, allBots } = useBoardSettings();
    const projectBots = project.useForeignField<BotModel.TModel>("bots");
    const { mutateAsync } = useUpdateProjectAssignedBots();

    const saveOnValueChanged = (items: TMultiSelectAssigneeItem[]) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            uid: project.uid,
            assigned_bots: (items as BotModel.TModel[]).map((bot) => bot.uid),
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
            },
        });
    };

    return (
        <Box py="4">
            <MultiSelectAssigneesForm
                multiSelectProps={{
                    placeholder: t("project.settings.Add a bot..."),
                    className: "w-full",
                    inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
                }}
                isValidating={isValidating}
                allItems={allBots}
                newItemFilter={(item) => allBots.includes(item as BotModel.TModel)}
                initialSelectedItems={projectBots}
                onValueChange={saveOnValueChanged}
                projectUID={project.uid}
            />
        </Box>
    );
});

export default BoardSettingsBots;
