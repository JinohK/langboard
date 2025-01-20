import { Box, Card, Textarea, Toast } from "@/components/base";
import useChangeUserGroupName from "@/controllers/api/account/useChangeUserGroupName";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { UserGroup } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IAccountUserGroupNameProps {
    group: UserGroup.TModel;
}

const AccountUserGroupName = memo(({ group }: IAccountUserGroupNameProps) => {
    const [t] = useTranslation();
    const groupName = group.useField("name");
    const { mutateAsync } = useChangeUserGroupName(group);

    const { valueRef, height, isEditing, updateHeight, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "textarea",
        save: (value, endCallback) => {
            const promise = mutateAsync({
                name: value,
            });

            const toastId = Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    let message = "";
                    const { handle } = setupApiErrorHandler({
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
                    return t("myAccount.successes.User group name changed successfully.");
                },
                finally: () => {
                    endCallback();
                    Toast.Add.dismiss(toastId);
                },
            });
        },
        originalValue: groupName,
    });

    return (
        <Card.Title className="w-[calc(100%_-_theme(spacing.6))]">
            {!isEditing ? (
                <Box cursor="text" minH="6" className="break-all border-b border-input" onClick={() => changeMode("edit")}>
                    {groupName}
                </Box>
            ) : (
                <Textarea
                    ref={valueRef}
                    className={cn(
                        "min-h-6 resize-none break-all rounded-none border-x-0 border-t-0 p-0 text-base scrollbar-hide",
                        "font-semibold leading-none tracking-tight focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    style={{ height }}
                    defaultValue={groupName}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onChange={updateHeight}
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
        </Card.Title>
    );
});

export default AccountUserGroupName;
