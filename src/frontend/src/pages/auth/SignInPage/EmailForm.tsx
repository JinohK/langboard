import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Button, Floating, Form, IconComponent } from "@/components/base";
import useAuthEmail from "@/controllers/auth/useAuthEmail";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EMAIL_TOKEN_QUERY_NAME, SIGN_IN_TOKEN_QUERY_NAME } from "@/pages/auth/SignInPage/constants";

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
            searchParams.append(SIGN_IN_TOKEN_QUERY_NAME, signToken);
            searchParams.append(EMAIL_TOKEN_QUERY_NAME, data.token);

            navigate(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`);
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                setErrors({ email: "signIn.errors.Couldn't find your {app} Account" });
                setTimeout(() => {
                    formRef.current!.email.focus();
                }, 0);
            },
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <>
            <div className={className}>
                <h2 className="text-4xl font-normal">{t("signIn.Sign in")}</h2>
                <div className="mt-4 text-base">{t("signIn.Use your {app} Account")}</div>
            </div>
            <Form.Root className={cn("max-xs:mt-11", className)} onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="email">
                    <Floating.LabelInput label={t("user.Email")} isFormControl autoFocus autoComplete="email" disabled={isValidating} />
                    {errors.email && <FormErrorMessage error={errors.email} icon="circle-alert" />}
                </Form.Field>
                <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isValidating}
                        onClick={() => navigate(`${ROUTES.SIGN_UP.REQUIRED}?${new URLSearchParams(location.search).toString()}`)}
                    >
                        {t("signIn.Create account")}
                    </Button>
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                    </Button>
                </div>
            </Form.Root>
        </>
    );
}

export default EmailForm;
