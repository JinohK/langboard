import { Button, Dialog, Floating, Form, Select } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import useCreateProject from "@/controllers/dashboard/useCreateProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export interface ICreateProjectFormDialogProps {
    opened: boolean;
    setOpened: (opened: boolean) => void;
}

function CreateProjectFormDialog({ opened, setOpened }: ICreateProjectFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useCreateProject();
    const [titleError, setTitleError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const types = ["SI", "SW"];

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const titleInput = event.currentTarget["project-title"];
        const title = titleInput.value.trim();
        const description = event.currentTarget["project-description"].value.trim();
        const type = event.currentTarget["project-type"].value;

        if (!title) {
            setTitleError(t("project.errors.missing.title"));
            setIsValidating(false);
            titleInput.focus();
            return;
        }

        mutate(
            { title, description, project_type: type },
            {
                onSuccess: (data) => {
                    navigate(ROUTES.BOARD.MAIN(data.project_uid));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_400_BAD_REQUEST]: () => {
                            setTitleError(t("project.errors.missing.title"));
                            titleInput.focus();
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Content className="sm:max-w-md">
                <Form.Root onSubmit={submit}>
                    <Dialog.Header>
                        <Dialog.Title>{t("dashboard.Create New Project")}</Dialog.Title>
                    </Dialog.Header>
                    <Form.Field name="project-title">
                        <Floating.LabelInput
                            label={t("project.Title")}
                            isFormControl
                            autoFocus
                            autoComplete="off"
                            className="mt-4"
                            disabled={isValidating}
                        />
                        {titleError && <FormErrorMessage error={titleError} icon="circle-alert" />}
                    </Form.Field>
                    <Form.Field name="project-description">
                        <Floating.LabelTextarea
                            label={t("project.Description")}
                            isFormControl
                            autoComplete="off"
                            className="mt-4"
                            resize="none"
                            disabled={isValidating}
                        />
                    </Form.Field>
                    <Form.Field name="project-type">
                        <Select.Root name="project-type" autoComplete="off" disabled={isValidating}>
                            <Select.Trigger className="mt-4 w-full">
                                <Select.Value placeholder={t("project.Type")} />
                            </Select.Trigger>
                            <Select.Content>
                                {types.map((type) => (
                                    <Select.Item key={type} value={type}>
                                        {t(`project.types.${type}`)}
                                    </Select.Item>
                                ))}
                                <Select.Item value="Other">{t("common.Other")}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Form.Field>
                    <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                        <Dialog.Close asChild>
                            <Button type="button" variant="destructive">
                                {t("common.Cancel")}
                            </Button>
                        </Dialog.Close>
                        <Button type="submit">{t("common.Create")}</Button>
                    </Dialog.Footer>
                </Form.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateProjectFormDialog;
