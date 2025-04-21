import { Button, Dialog } from "@/components/base";
import { BotModel } from "@/core/models";
import BoardSettingsCronBotScheduleList from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleList";
import { useTranslation } from "react-i18next";

export interface IBOardSettingsCronBotScheduleListDialogProps {
    bot: BotModel.TModel;
}

function BoardSettingsCronBotScheduleListDialog({ bot }: IBOardSettingsCronBotScheduleListDialogProps): JSX.Element {
    const [t] = useTranslation();

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button size="sm">{t("project.settings.Show schedules")}</Button>
            </Dialog.Trigger>
            <Dialog.Content className="p-2 pt-8 sm:max-w-screen-sm md:max-w-screen-md" aria-describedby="">
                <Dialog.Title hidden />
                <BoardSettingsCronBotScheduleList bot={bot} />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardSettingsCronBotScheduleListDialog;
