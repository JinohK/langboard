import { Box, Input, Table, Toast } from "@/components/base";
import useUpdateSetting from "@/controllers/api/settings/useUpdateSetting";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { AppSettingModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IWebhookNameProps {
    url: AppSettingModel.TModel;
}

const WebhookName = memo(({ url }: IWebhookNameProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const name = url.useField("setting_name");
    const { mutateAsync } = useUpdateSetting(url);

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                setting_name: value,
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
                    return t("settings.successes.Webhook name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: name,
    });

    return (
        <Table.Cell className={cn("w-1/6 max-w-0 truncate text-center", isEditing && "py-0")}>
            {!isEditing ? (
                <Box cursor="text" onClick={() => changeMode("edit")}>
                    {name}
                </Box>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
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
        </Table.Cell>
    );
});

export default WebhookName;
