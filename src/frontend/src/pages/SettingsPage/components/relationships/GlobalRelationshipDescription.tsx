import { Box, Input, Table, Toast } from "@/components/base";
import useUpdateGlobalRelationship from "@/controllers/api/settings/relationships/useUpdateGlobalRelationship";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

function GlobalRelationshipDescription() {
    const [t] = useTranslation();
    const { model: globalRelationship } = ModelRegistry.GlobalRelationshipType.useContext();
    const { navigateRef } = useAppSetting();
    const description = globalRelationship.useField("description");
    const { mutateAsync } = useUpdateGlobalRelationship(globalRelationship);

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        canEmpty: true,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                description: value,
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
                    return t("settings.successes.Description changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: description,
    });

    return (
        <Table.Cell className={cn("max-w-0 truncate text-center", isEditing && "py-0")}>
            {!isEditing ? (
                <Box cursor="text" className={cn(!description.length && "text-muted-foreground/70")} onClick={() => changeMode("edit")}>
                    {description.length ? description : t("settings.No description")}
                </Box>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={description}
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
}

export default GlobalRelationshipDescription;
