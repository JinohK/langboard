import { Button, DropdownMenu, Flex, Floating, Popover, SubmitButton, Toast } from "@/components/base";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import { useBoardSettingsLabel } from "@/core/providers/BoardSettingsLabelProvider";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsLabelRelatedProps } from "@/pages/BoardPage/components/settings/label/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsLabelMoreChangeDescriptionProps extends IBoardSettingsLabelRelatedProps {
    labelDescription: string;
}

function BoardSettingsLabelMoreChangeDescription({
    setIsMoreMenuOpened,
    labelDescription,
}: IBoardSettingsLabelMoreChangeDescriptionProps): JSX.Element {
    const { project } = useBoardSettings();
    const { label, isValidating, setIsValidating, sharedErrorHandler } = useBoardSettingsLabel();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const descriptionInputId = `project-label-description-input-${label.uid}`;
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("description");

    const changeLabelDescription = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const descriptionInput = document.getElementById(descriptionInputId) as HTMLInputElement;
        const description = descriptionInput.value.trim();

        if (!description) {
            Toast.Add.error(t("project.settings.errors.Description cannot be empty."));
            setIsValidating(false);
            descriptionInput.focus();
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            description,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("project.settings.successes.Description changed successfully.");
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
                    {t("project.settings.Change description")}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Floating.LabelInput
                    label={t("project.settings.Description")}
                    id={descriptionInputId}
                    defaultValue={labelDescription}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            changeLabelDescription();
                        }
                    }}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={changeLabelDescription} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsLabelMoreChangeDescription;
