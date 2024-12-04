import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import SubmitButton from "@/components/SubmitButton";
import { Floating, Form, Toast } from "@/components/base";
import useAddNewEmail from "@/controllers/api/account/useAddNewEmail";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import TypeUtils from "@/core/utils/TypeUtils";
import { IEmailComponentProps } from "@/pages/AccountPage/components/types";

function AddSubEmailForm({ user, updatedUser, isValidating, setIsValidating }: IEmailComponentProps): JSX.Element {
    const [t, i18n] = useTranslation();
    const { mutate } = useAddNewEmail();
    const { errors, handleSubmit, formRef } = useForm({
        errorLangPrefix: "myAccount.errors",
        schema: {
            new_email: {
                required: true,
                email: true,
                custom: {
                    errorKey: "invalid",
                    validate: (value) => {
                        if (!user || !TypeUtils.isString(value) || user.email === value) {
                            return false;
                        }

                        for (let i = 0; i < user.subemails.length; ++i) {
                            if (user.subemails[i].email === value) {
                                return false;
                            }
                        }

                        return true;
                    },
                },
            },
        },
        isValidatingState: [isValidating, setIsValidating],
        predefineValues: () => ({ lang: i18n.language }),
        mutate,
        mutateOnSuccess: () => {
            Toast.Add.success(t("myAccount.Please check your inbox to verify your email."));
            formRef.current?.reset();
            updatedUser();
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
            },
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <div>
            <h4 className="pb-2 text-lg font-semibold tracking-tight">{t("myAccount.Add new email")}</h4>
            <Form.Root className="flex items-start gap-2" onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="new_email">
                    <Floating.LabelInput
                        label={t("user.Email")}
                        isFormControl
                        autoFocus
                        autoComplete="email"
                        disabled={isValidating}
                        className="h-9 w-64 py-2"
                    />
                    {errors.new_email && <FormErrorMessage error={errors.new_email} icon="circle-alert" />}
                </Form.Field>
                <SubmitButton type="submit" size="sm" isValidating={isValidating}>
                    {t("common.Save")}
                </SubmitButton>
            </Form.Root>
        </div>
    );
}

export default AddSubEmailForm;
