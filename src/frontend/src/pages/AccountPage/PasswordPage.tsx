import { useTranslation } from "react-i18next";
import PasswordInput from "@/components/PasswordInput";
import { Button, Form, IconComponent, Toast } from "@/components/base";
import useChangePassword from "@/controllers/account/useChangePassword";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";

function PasswordPage(): JSX.Element {
    const { updatedUser } = useAuth();
    const [t] = useTranslation();
    const { mutate } = useChangePassword();
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "myAccount.errors",
        schema: {
            current_password: { required: true },
            new_password: { required: true },
            "password-confirm": { required: true, sameWith: "new_password" },
        },
        mutate,
        mutateOnSuccess: () => {
            Toast.Add.success(t("myAccount.Password updated successfully."));
            formRef.current?.reset();
            updatedUser();
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("user.Password")}</h2>
            <Form.Root className="mt-11" onSubmit={handleSubmit} ref={formRef}>
                <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                        <PasswordInput
                            name="current_password"
                            label={t("user.Current password")}
                            isFormControl
                            autoFocus
                            isValidating={isValidating}
                            error={errors.current_password}
                        />
                        <PasswordInput
                            name="new_password"
                            label={t("user.New password")}
                            className="mt-4"
                            isFormControl
                            isValidating={isValidating}
                            error={errors.new_password}
                        />
                        <PasswordInput
                            name="password-confirm"
                            label={t("user.Confirm new password")}
                            className="mt-4"
                            isFormControl
                            isValidating={isValidating}
                            error={errors["password-confirm"]}
                        />
                    </div>
                </div>
                <div className="mt-16 flex items-center justify-center gap-8">
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Save")}
                    </Button>
                </div>
            </Form.Root>
        </>
    );
}

export default PasswordPage;
