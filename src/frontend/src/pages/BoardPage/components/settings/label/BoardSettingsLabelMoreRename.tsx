import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import { useBoardSettingsLabel } from "@/core/providers/BoardSettingsLabelProvider";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsLabelRelatedProps } from "@/pages/BoardPage/components/settings/label/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsLabelMoreRenameProps extends IBoardSettingsLabelRelatedProps {
    labelName: string;
}

function BoardSettingsLabelMoreRename({ setIsMoreMenuOpened, labelName }: IBoardSettingsLabelMoreRenameProps): JSX.Element {
    const { label, isValidating, setIsValidating, sharedErrorHandler } = useBoardSettingsLabel();
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("name");
    const nameInputId = `project-label-name-input-${label.uid}`;

    const changeLabelName = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const nameInput = document.getElementById(nameInputId) as HTMLInputElement;
        const name = nameInput.value.trim();

        if (!name) {
            Toast.Add.error(t("project.settings.errors.Label name cannot be empty."));
            setIsValidating(false);
            nameInput.focus();
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            name,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("project.settings.successes.Label name changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpened(true);
                    }}
                >
                    {t("project.settings.Rename")}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Floating.LabelInput
                    label={t("project.settings.Label name")}
                    id={nameInputId}
                    defaultValue={labelName}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            changeLabelName();
                        }
                    }}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeLabelName} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsLabelMoreRename;
