import { Box, Input, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBotNameProps {
    bot: BotModel.TModel;
}

const BotName = memo(({ bot }: IBotNameProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const name = bot.useField("name");
    const { mutateAsync } = useUpdateBot(bot);

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                bot_name: value,
            });

            const toastId = Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    let message = "";
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            message = t("errors.Forbidden");
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
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
                success: (data) => {
                    data.createToast(t("settings.successes.Bot name changed successfully."));
                    setTimeout(() => {
                        Toast.Add.dismiss(toastId.toString());
                    }, 0);
                    return null;
                },
                finally: () => {
                    endCallback();
                    Toast.Add.dismiss(toastId);
                },
            });
        },
        originalValue: name,
    });

    return (
        <Box>
            {!isEditing ? (
                <Box cursor="text" onClick={() => changeMode("edit")}>
                    {name}
                </Box>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-base scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={name}
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
            )}
        </Box>
    );
});

export default BotName;
