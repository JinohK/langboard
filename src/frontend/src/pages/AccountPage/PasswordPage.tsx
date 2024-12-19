import { useTranslation } from "react-i18next";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import { Box, Flex, Form, Toast } from "@/components/base";
import useChangePassword from "@/controllers/api/account/useChangePassword";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useEffect } from "react";

function PasswordPage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
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
            Toast.Add.success(t("myAccount.successes.Password updated successfully."));
            formRef.current?.reset();
            updatedUser();
        },
        useDefaultBadRequestHandler: true,
    });

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("user.Password")}</h2>
            <Form.Root className="mt-11" onSubmit={handleSubmit} ref={formRef}>
                <Flex justify="center">
                    <Box w="full" className="max-w-sm">
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
                    </Box>
                </Flex>
                <Flex items="center" justify="center" gap="8" mt="16">
                    <SubmitButton type="submit" isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Form.Root>
        </>
    );
}

export default PasswordPage;
