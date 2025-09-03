import { Box, Flex, IconComponent, Input, Table, Toast } from "@/components/base";
import useUpdateSetting from "@/controllers/api/settings/useUpdateSetting";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { useTranslation } from "react-i18next";

function WebhookURL() {
    const [t] = useTranslation();
    const { model: url } = ModelRegistry.AppSettingModel.useContext();
    const navigate = usePageNavigateRef();
    const urlValue = url.useField("setting_value");
    const editorName = `${url.uid}-webhook-url`;
    const { mutateAsync } = useUpdateSetting(url, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                setting_value: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                            },
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("successes.Webhook URL changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: urlValue,
    });

    return (
        <Table.FlexCell
            className={cn(
                "w-[calc(calc(100%_/_6_*_3)_-_theme(spacing.12))] truncate text-center",
                isEditing && "pb-2.5 pt-[calc(theme(spacing.4)_-_2px)]"
            )}
        >
            {!isEditing ? (
                <Flex cursor="pointer" justify="center" items="center" gap="1" position="relative" onClick={() => changeMode("edit")}>
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        {urlValue}
                    </Box>
                    <Box position="relative">
                        <Box position="absolute" left="2" className="top-1/2 -translate-y-1/2">
                            <IconComponent icon="pencil" size="4" />
                        </Box>
                    </Box>
                </Flex>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={urlValue}
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
        </Table.FlexCell>
    );
}

export default WebhookURL;
