import { Box, Card, Textarea, Toast } from "@/components/base";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { UserGroup } from "@/core/models";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IAccountUserGroupNameProps {
    group: UserGroup.TModel;
}

const AccountUserGroupName = memo(({ group }: IAccountUserGroupNameProps) => {
    const [t] = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const groupName = group.useField("name");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [height, setHeight] = useState(0);
    const changeMode = (mode: "edit" | "view") => {
        if (mode === "edit") {
            setIsEditing(true);
            setTimeout(() => {
                setHeight(measureTextAreaHeight(textareaRef.current!));
                if (!textareaRef.current) {
                    return;
                }

                textareaRef.current.selectionStart = textareaRef.current.value.length;
                textareaRef.current.selectionEnd = textareaRef.current.value.length;
                textareaRef.current.focus();
            }, 0);
            return;
        }

        const newValue = textareaRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length || group.name.trim() === newValue) {
            setIsEditing(false);
            return;
        }

        const promise = new Promise((resolve) => setTimeout(resolve, 3000));

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
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Card.Title>
            {!isEditing ? (
                <Box className="min-h-6 cursor-text break-all border-b border-input" onClick={() => changeMode("edit")}>
                    {groupName}
                </Box>
            ) : (
                <Textarea
                    ref={textareaRef}
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
                    onChange={() => {
                        setHeight(measureTextAreaHeight(textareaRef.current!));
                    }}
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
