import { TBotLogRelatedParams } from "@/controllers/api/shared/botLogs/types";
import { BotModel, BotLogModel, ProjectCard, ProjectColumn } from "@/core/models";
import { createContext, useContext, useEffect, useState } from "react";

export interface IBotLogListContext {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: ProjectColumn.TModel | ProjectCard.TModel;
}

interface IBotLogListProps {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: ProjectColumn.TModel | ProjectCard.TModel;
    children: React.ReactNode;
}

const initialContext = {
    bot: {} as BotModel.TModel,
    params: {} as TBotLogRelatedParams,
    target: {} as ProjectColumn.TModel | ProjectCard.TModel,
};

const BotLogListContext = createContext<IBotLogListContext>(initialContext);

export const BotLogListProvider = ({ bot, params, target, children }: IBotLogListProps): React.ReactNode => {
    return (
        <BotLogListContext.Provider
            value={{
                bot,
                params,
                target,
            }}
        >
            {children}
        </BotLogListContext.Provider>
    );
};

export const useBotLogList = () => {
    const context = useContext(BotLogListContext);
    if (!context) {
        throw new Error("useBotLogList must be used within an BotLogListProvider");
    }
    return context;
};
