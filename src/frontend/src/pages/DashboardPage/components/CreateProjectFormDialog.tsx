import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Button, Dialog, Floating, Form, Select } from "@/components/base";
import useCreateProject from "@/controllers/dashboard/useCreateProject";
import useForm from "@/core/hooks/form/useForm";
import { Project } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";

export interface ICreateProjectFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function CreateProjectFormDialog({ opened, setOpened }: ICreateProjectFormDialogProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useCreateProject();
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "project.errors",
        schema: {
            title: { required: true },
            description: {},
            project_type: {},
        },
        mutate,
        mutateOnSuccess: (data) => {
            navigate(ROUTES.BOARD.MAIN(data.project_uid));
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Content className="sm:max-w-md">
                <Form.Root onSubmit={handleSubmit} ref={formRef}>
                    <Dialog.Header>
                        <Dialog.Title>{t("dashboard.Create New Project")}</Dialog.Title>
                    </Dialog.Header>
                    <Form.Field name="title">
                        <Floating.LabelInput
                            label={t("project.Title")}
                            isFormControl
                            autoFocus
                            autoComplete="off"
                            className="mt-4"
                            disabled={isValidating}
                        />
                        {errors.title && <FormErrorMessage error={errors.title} icon="circle-alert" />}
                    </Form.Field>
                    <Form.Field name="description">
                        <Floating.LabelTextarea
                            label={t("project.Description")}
                            isFormControl
                            autoComplete="off"
                            className="mt-4"
                            resize="none"
                            disabled={isValidating}
                        />
                    </Form.Field>
                    <Form.Field name="project_type">
                        <Select.Root name="project_type" autoComplete="off" disabled={isValidating}>
                            <Select.Trigger className="mt-4 w-full">
                                <Select.Value placeholder={t("project.Type")} />
                            </Select.Trigger>
                            <Select.Content>
                                {Project.TYPES.map((type) => (
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
