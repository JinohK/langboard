import { Box, Flex, Loading, ScrollArea } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetProjectBotSchedules from "@/controllers/api/board/settings/useGetProjectBotSchedules";
import useBoardBotCronScheduledHandlers from "@/controllers/socket/board/settings/useBoardBotCronScheduledHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { BotModel, BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardSettingsCronBotSchedule from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotSchedule";
import BoardSettingsCronBotScheduleAddButton from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleAddButton";
import { IBotScheduleFormMap } from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useCallback, useEffect, useRef, useState } from "react";

export interface IBoardSettingsCronBotScheduleListProps {
    bot: BotModel.TModel;
}

function BoardSettingsCronBotScheduleList({ bot }: IBoardSettingsCronBotScheduleListProps): JSX.Element {
    const { socket, project } = useBoardSettings();
    const { mutateAsync, isLastPage, isFetchingRef } = useGetProjectBotSchedules(project.uid, bot.uid);
    const [copiedForm, setCopiedForm] = useState<IBotScheduleFormMap | undefined>(undefined);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const schedules = BotSchedule.Model.useModels(
        (model) => model.bot_uid === bot.uid && model.filterable_table === "project" && model.filterable_uid === project.uid
    );
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                resolve(true);
            }, 1000);
        });
    }, [isLastPage, mutateAsync]);
    const botCronScheduledHandlers = useBoardBotCronScheduledHandlers({
        projectUID: project.uid,
        botUID: bot.uid,
    });
    useSwitchSocketHandlers({ socket, handlers: [botCronScheduledHandlers] });
    const [isAddMode, setIsAddMode] = useState(false);

    useEffect(() => {
        if (!isAddMode) {
            setCopiedForm(undefined);
        }
    }, [isAddMode, setCopiedForm]);

    return (
        <Flex direction="col" gap="2">
            <ScrollArea.Root viewportRef={viewportRef} mutable={schedules}>
                <InfiniteScroller.NoVirtual
                    scrollable={() => viewportRef.current}
                    loadMore={nextPage}
                    hasMore={!isLastPage}
                    loader={
                        <Flex justify="center" mt="6" key={createShortUUID()}>
                            <Loading size="3" variant="secondary" />
                        </Flex>
                    }
                    className="max-h-[calc(70vh_-_theme(spacing.20)_-_theme(spacing.1))]"
                >
                    <Box display={{ initial: "flex", sm: "grid" }} direction="col" gap="2" className="sm:grid-cols-2">
                        {schedules.map((schedule) => (
                            <BoardSettingsCronBotSchedule
                                key={schedule.uid}
                                bot={bot}
                                schedule={schedule}
                                setCopiedForm={setCopiedForm}
                                setIsAddMode={setIsAddMode}
                            />
                        ))}
                    </Box>
                </InfiniteScroller.NoVirtual>
            </ScrollArea.Root>
            <BoardSettingsCronBotScheduleAddButton botUID={bot.uid} copiedForm={copiedForm} isAddMode={isAddMode} setIsAddMode={setIsAddMode} />
        </Flex>
    );
}

export default BoardSettingsCronBotScheduleList;
