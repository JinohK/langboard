import { Box, Flex, Input, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBotUniqueNameProps {
    bot: BotModel.TModel;
}

const BotUniqueName = memo(({ bot }: IBotUniqueNameProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const uname = bot.useField("bot_uname");
    const { mutateAsync } = useUpdateBot(bot);

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                bot_uname: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    let message = "";
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            message = t("errors.Forbidden");
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            message = t("settings.errors.Bot unique name already exists.");
                        },
                        nonApiError: () => {
                            message = t("errors.Unknown error");
                        },
                        wildcardError: () => {
                            message = t("errors.Internal server error");
                        },
                    });

                    handle(error);
                    return message;
                },
                success: () => {
                    return t("settings.successes.Bot unique name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: uname.slice(BotModel.Model.BOT_UNAME_PREFIX.length),
    });

    return (
        <Flex items="center">
            {!isEditing ? (
                <Box cursor="text" w="full" textSize="sm" onClick={() => changeMode("edit")}>
                    {uname}
                </Box>
            ) : (
                <>
                    <Box textSize="sm">{BotModel.Model.BOT_UNAME_PREFIX}</Box>
                    <Input
                        ref={valueRef}
                        className={cn(
                            "ml-0 h-5 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-sm scrollbar-hide",
                            "focus-visible:border-b-primary focus-visible:ring-0"
                        )}
                        defaultValue={uname.slice(BotModel.Model.BOT_UNAME_PREFIX.length)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onBlur={() => changeMode("view")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                changeMode("view");
                                return;
                            }
                        }}
                    />
                </>
            )}
        </Flex>
    );
});

export default BotUniqueName;
