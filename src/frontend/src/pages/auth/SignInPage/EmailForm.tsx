import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { QUERY_NAMES } from "@/constants";
import { Box, Button, Flex, Floating, Form, SubmitButton } from "@/components/base";
import useAuthEmail from "@/controllers/api/auth/useAuthEmail";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useNavigate } from "react-router-dom";

export interface IEmailFormProps {
    signToken: string;
    setEmail: (email: string) => void;
    className: string;
}

function EmailForm({ signToken, setEmail, className }: IEmailFormProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useAuthEmail();
    const { errors, setErrors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "signIn.errors",
        schema: {
            email: { required: true, email: true },
        },
        predefineValues: { is_token: false, sign_token: signToken },
        mutate,
        mutateOnSuccess: (data) => {
            if (!data.token) {
                setErrors({ email: "signIn.errors.Couldn't find your {app} Account" });
                return;
            }

            setEmail(formRef.current!.email.value);

            const searchParams = new URLSearchParams();
            searchParams.append(QUERY_NAMES.SIGN_IN_TOKEN, signToken);
            searchParams.append(QUERY_NAMES.EMAIL_TOKEN, data.token);

            navigate(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`);
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                setErrors({ email: "signIn.errors.Couldn't find your {app} Account" });
                setTimeout(() => {
                    formRef.current!.email.focus();
                }, 0);
            },
            [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: () => {
                setErrors({ email: "signIn.errors.Email is not verified yet." });
            },
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <>
            <Box className={className}>
                <h2 className="text-4xl font-normal">{t("signIn.Sign in")}</h2>
                <Box mt="4" textSize="base">
                    {t("signIn.Use your {app} Account")}
                </Box>
            </Box>
            <Form.Root className={cn("mt-11 xs:mt-0", className)} onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="email">
                    <Floating.LabelInput label={t("user.Email")} isFormControl autoFocus autoComplete="email" disabled={isValidating} />
                    {errors.email && <FormErrorMessage error={errors.email} icon="circle-alert" />}
                </Form.Field>
                <Flex items="center" gap="8" justify={{ initial: "between", xs: "end" }} mt="16">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isValidating}
                        onClick={() => navigate(`${ROUTES.SIGN_UP.REQUIRED}?${new URLSearchParams(location.search).toString()}`)}
                    >
                        {t("signIn.Create account")}
                    </Button>
                    <SubmitButton type="submit" isValidating={isValidating}>
                        {t("common.Next")}
                    </SubmitButton>
                </Flex>
            </Form.Root>
        </>
    );
}

export default EmailForm;
