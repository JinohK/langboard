import { Floating, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BotPrompt = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const { navigateRef } = useAppSetting();
    const prompt = bot.useField("prompt");
    const { mutateAsync } = useUpdateBot(bot);

    const { valueRef, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "textarea",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                prompt: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                                after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                            },
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("settings.successes.Bot prompt changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: prompt,
    });

    return (
        <Floating.LabelTextarea
            label={t("settings.Bot prompt")}
            autoComplete="off"
            resize="none"
            onFocus={() => changeMode("edit")}
            onBlur={() => changeMode("view")}
            defaultValue={prompt}
            ref={valueRef}
        />
    );
});

export default BotPrompt;
