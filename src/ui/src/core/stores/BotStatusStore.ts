import { useEffect, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface IUpdateBotStatusParams {
    type: "project_column" | "card";
    botUID: string;
    targetUID: string;
    status: "running" | "stopped";
}

export interface IBotStatusStore {
    botStatusMap: Record<IUpdateBotStatusParams["type"], Record<string, string[]>>;
    updateBotStatus: (params: IUpdateBotStatusParams) => void;
    replaceMap: (map: IBotStatusStore["botStatusMap"]) => void;
}

const useBotStatusStore = create(
    immer<IBotStatusStore>((set, get) => {
        return {
            botStatusMap: {
                project_column: {},
                card: {},
            },
            updateBotStatus: ({ type, botUID, targetUID, status }: IUpdateBotStatusParams) => {
                const botStatusMap = get().botStatusMap;

                const typeMap = { ...botStatusMap[type] };
                if (!typeMap[targetUID]) {
                    typeMap[targetUID] = [];
                }
                const statusList = [...typeMap[targetUID]];

                if (status === "running") {
                    statusList.push(botUID);
                } else {
                    const foundIndex = statusList.indexOf(botUID);
                    if (foundIndex > -1) {
                        statusList.splice(foundIndex, 1);
                    }
                }

                botStatusMap[type][targetUID] = statusList;

                set({ botStatusMap });
            },
            replaceMap: (map: IBotStatusStore["botStatusMap"]) => {
                set({ botStatusMap: map });
            },
        };
    })
);
export const getBotStatusStore = () => useBotStatusStore.getState();

export const useHasRunningBot = ({ type, targetUID }: Omit<IUpdateBotStatusParams, "botUID" | "status">): bool => {
    const [hasRunningBot, setHasRunningBot] = useState((getBotStatusStore().botStatusMap[type][targetUID]?.length || 0) > 0);

    useEffect(() => {
        const off = useBotStatusStore.subscribe((state) => {
            const running = (state.botStatusMap[type][targetUID]?.length || 0) > 0;
            if (running !== hasRunningBot) {
                setHasRunningBot(running);
            }
        });

        return off;
    }, [hasRunningBot, setHasRunningBot, targetUID]);

    return hasRunningBot;
};

export default useBotStatusStore;
