import { IBaseModel } from "@/core/models/Base";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends Omit<IBaseModel, "uid"> {
    bot_type: string;
    display_name: string;
    avatar?: string;
}

export const transformFromApi = <TInternalBotModel extends Interface | Interface[]>(
    botModels: TInternalBotModel
): TInternalBotModel extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(botModels)) {
        botModels.avatar = convertServerFileURL(botModels.avatar);
        return botModels as unknown as TInternalBotModel extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < botModels.length; ++i) {
        botModels[i].avatar = convertServerFileURL(botModels[i].avatar);
    }

    return botModels as unknown as TInternalBotModel extends Interface ? Interface : Interface[];
};
