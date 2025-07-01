/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotModel, User } from "@/core/models";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";

export interface IUserLikeComponentProps<TSharedCompProps extends Record<string, unknown> = Record<string, unknown>> {
    userOrBot: TUserLikeModel;
    userComp: React.ComponentType<TSharedCompProps & { user: User.TModel }>;
    botComp: React.ComponentType<TSharedCompProps & { bot: BotModel.TModel }>;
    props?: TSharedCompProps;
    shouldReturnNull?: bool;
    customNullReturn?: React.ReactNode;
}

function UserLikeComponent<TSharedCompProps extends Record<string, unknown> = Record<string, unknown>>({
    userOrBot,
    userComp: UserComp,
    botComp: BotComp,
    props,
    shouldReturnNull,
    customNullReturn,
}: IUserLikeComponentProps<TSharedCompProps>) {
    if (isModel(userOrBot, "User")) {
        return <UserComp {...(props as any)} user={userOrBot} />;
    }

    if (isModel(userOrBot, "BotModel")) {
        return <BotComp {...(props as any)} bot={userOrBot} />;
    }

    if (customNullReturn) {
        return customNullReturn;
    }

    if (shouldReturnNull) {
        return null;
    }

    return <></>;
}

export default UserLikeComponent;
