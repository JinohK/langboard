import { Button, Form, IconComponent, Input, Toast } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import useSendResetLink, { TSendResetLinkForm } from "@/controllers/recovery/useSendResetLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler, { IApiErrorHandlerMap } from "@/core/helpers/setupApiErrorHandler";
import SuccessResult from "@/pages/AccountRecoveryPage/SuccessResult";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export interface ISendResetLinkFormProps {
    signToken: string;
    emailToken: string;
    backToSignin: () => void;
}

function SendResetLinkForm({ signToken, emailToken, backToSignin }: ISendResetLinkFormProps): JSX.Element {
    const [t, i18n] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [[firstnameError, lastnameError], setErrors] = useState<[string, string]>(["", ""]);
    const { mutate } = useSendResetLink();
    const [isValidating, setIsValidating] = useState(false);

    const sendLink = (form: TSendResetLinkForm, successCallback: () => void, errorMap: IApiErrorHandlerMap) =>
        mutate(form, {
            onSuccess: successCallback,
            onError: (error) => {
                const { handle } = setupApiErrorHandler(errorMap);

                handle(error);
            },
            onSettled: () => {
                setIsValidating(false);
            },
        });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const firstnameInput = event.currentTarget.firstname;
        const firstname = firstnameInput.value;
        const lastnameInput = event.currentTarget.lastname;
        const lastname = lastnameInput.value;

        const errors: [string, string] = ["", ""];

        if (!firstname) {
            errors[0] = "accountRecovery.errors.missing.firstname";
        }

        if (!lastname) {
            errors[1] = "accountRecovery.errors.missing.lastname";
        }

        if (errors[0] || errors[1]) {
            setErrors(errors);
            setIsValidating(false);
            if (errors[0]) {
                firstnameInput.focus();
            } else {
                lastnameInput.focus();
            }
            return;
        }

        sendLink(
            { sign_token: signToken, email_token: emailToken, firstname, lastname, lang: i18n.language },
            () => {
                navigate(location, { state: { isTwoSidedView: false } });
            },
            {
                [EHttpStatus.HTTP_400_BAD_REQUEST]: (error) => {
                    const errorType = error.response?.data?.errors.value_error ? "invalid" : "missing";
                    setErrors(["", `accountRecovery.errors.${errorType}.name`]);
                    lastnameInput.focus();
                },
                [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                    backToSignin();
                },
                [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                    Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
                },
            }
        );
    };

    const handleResend = () => {
        setIsValidating(true);

        sendLink(
            { sign_token: signToken, email_token: emailToken, is_resend: true, lang: i18n.language },
            () => {
                Toast.Add.success(t("accountRecovery.Resent link successfully."));
            },
            {
                [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                    backToSignin();
                },
                [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                    Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
                },
            }
        );
    };

    if (!(location.state?.isTwoSidedView ?? true)) {
        const buttons = (
            <>
                <Button type="button" onClick={backToSignin}>
                    {t("common.Back to Sign In")}
                </Button>
                <Button type="button" onClick={handleResend}>
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
            <Form.Root className="max-xs:mt-11" onSubmit={handleSubmit}>
                <Form.Field name="firstname">
                    <Form.Control asChild>
                        <Input type="text" className="w-full" placeholder={t("accountRecovery.First Name")} autoFocus disabled={isValidating} />
                    </Form.Control>
                    {firstnameError && <FormErrorMessage error={firstnameError} icon="circle-alert" />}
                </Form.Field>
                <Form.Field name="lastname" className="mt-3">
                    <Form.Control asChild>
                        <Input type="text" className="w-full" placeholder={t("accountRecovery.Last Name")} autoFocus disabled={isValidating} />
                    </Form.Control>
                    {lastnameError && <FormErrorMessage error={lastnameError} icon="circle-alert" />}
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
