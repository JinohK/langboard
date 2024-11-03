import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Button, Floating, Form, IconComponent, Toast } from "@/components/base";
import useSendResetLink from "@/controllers/auth/useSendResetLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import SuccessResult from "@/pages/AccountRecoveryPage/SuccessResult";

export interface ISendResetLinkFormProps {
    signToken: string;
    emailToken: string;
    backToSignin: () => void;
}

function SendResetLinkForm({ signToken, emailToken, backToSignin }: ISendResetLinkFormProps): JSX.Element {
    const [t, i18n] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate } = useSendResetLink();
    const isResendRef = useRef(false);
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "accountRecovery.errors",
        schema: () => ({
            firstname: { required: !isResendRef.current },
            lastname: { required: !isResendRef.current },
        }),
        beforeHandleSubmit: () => {
            isResendRef.current = !(location.state?.isTwoSidedView ?? true);
        },
        predefineValues: () => {
            if (isResendRef.current) {
                return { sign_token: signToken, email_token: emailToken, is_resend: true, lang: i18n.language };
            } else {
                return { sign_token: signToken, email_token: emailToken, lang: i18n.language };
            }
        },
        mutate,
        mutateOnSuccess: () => {
            if (isResendRef.current) {
                Toast.Add.success(t("accountRecovery.Resent link successfully."));
            } else {
                navigate(location, { state: { isTwoSidedView: false } });
            }
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                backToSignin();
            },
            [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
            },
        },
        useDefaultBadRequestHandler: true,
    });

    if (!(location.state?.isTwoSidedView ?? true)) {
        const buttons = (
            <>
                <Button type="button" onClick={backToSignin}>
                    {t("common.Back to Sign In")}
                </Button>
                <Button type="button" onClick={() => handleSubmit({})}>
                    {t("accountRecovery.Resend Link")}
                </Button>
            </>
        );
        return (
            <SuccessResult title={t("accountRecovery.Password Reset Link Sent")} buttons={buttons}>
                <p>
                    {t("accountRecovery.A password reset link has been successfully sent to your registered email address.")}&nbsp;
                    {t(
                        // eslint-disable-next-line @/max-len
                        "accountRecovery.Please check your inbox (and spam/junk folder) for the email. Follow the instructions in the email to reset your password."
                    )}
                </p>
                <p className="mt-6">
                    {t("accountRecovery.If you do not receive the email within a few minutes, please try again or contact support for assistance.")}
                </p>
            </SuccessResult>
        );
    } else {
        return (
            <Form.Root className="max-xs:mt-11" onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="firstname">
                    <Floating.LabelInput label={t("user.First Name")} isFormControl autoFocus disabled={isValidating} />
                    {errors.firstname && <FormErrorMessage error={errors.firstname} icon="circle-alert" />}
                </Form.Field>
                <Form.Field name="lastname" className="mt-3">
                    <Floating.LabelInput label={t("user.Last Name")} isFormControl disabled={isValidating} />
                    {errors.lastname && <FormErrorMessage error={errors.lastname} icon="circle-alert" />}
                </Form.Field>
                <div className="mt-16 flex items-center gap-8 max-xs:justify-end xs:justify-end">
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                    </Button>
                </div>
            </Form.Root>
        );
    }
}

export default SendResetLinkForm;
