import { Button, Dialog, Form, IconComponent, Input, Select, Textarea, Toast } from "@/components/base";
import useCreateProject from "@/controllers/dashboard/useCreateProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import { isAxiosError } from "axios";
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
                    if (!isAxiosError(error)) {
                        console.error(error);
                        Toast.Add.error(t("errors.Unknown error"));
                        return;
                    }

                    if (error.response?.status === EHttpStatus.HTTP_400_BAD_REQUEST) {
                        setTitleError(t("project.errors.missing.title"));
                        titleInput.focus();
                        return;
                    }

                    Toast.Add.error(t("errors.Internal server error"));
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
                        <Form.Control asChild>
                            <Input className="mt-4 w-full" placeholder={t("project.Title")} autoFocus autoComplete="off" disabled={isValidating} />
                        </Form.Control>
                        {titleError && (
                            <Form.Message>
                                <div className="mt-1 flex items-center gap-1">
                                    <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                                    <span className="text-sm text-red-500">{t(titleError)}</span>
                                </div>
                            </Form.Message>
                        )}
                    </Form.Field>
                    <Form.Field name="project-description">
                        <Form.Control asChild>
                            <Textarea
                                className="mt-4 w-full"
                                placeholder={t("project.Description")}
                                autoFocus
                                autoComplete="off"
                                resize="none"
                                disabled={isValidating}
                            />
                        </Form.Control>
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
