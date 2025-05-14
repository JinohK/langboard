import { Box, Input, Table, Toast } from "@/components/base";
import useUpdateGlobalRelationship from "@/controllers/api/settings/relationships/useUpdateGlobalRelationship";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { GlobalRelationshipType } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IGlobalRelationshipChildNameProps {
    globalRelationship: GlobalRelationshipType.TModel;
}

const GlobalRelationshipChildName = memo(({ globalRelationship }: IGlobalRelationshipChildNameProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const childName = globalRelationship.useField("child_name");
    const { mutateAsync } = useUpdateGlobalRelationship(globalRelationship);

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                child_name: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                                messageRef.message = t("errors.Forbidden");
                                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                            },
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("settings.successes.Child name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: childName,
    });

    return (
        <Table.Cell className={cn("w-1/6 max-w-0 truncate text-center", isEditing && "py-0")}>
            {!isEditing ? (
                <Box cursor="text" onClick={() => changeMode("edit")}>
                    {childName}
                </Box>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={childName}
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

export default GlobalRelationshipChildName;
