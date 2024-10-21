import { Button, Form, IconComponent, Input, Toast } from "@/components/base";
import useRecoveryPassword from "@/controllers/recovery/useRecoveryPassword";
import { RECOVERY_TOKEN_QUERY_NAME } from "@/controllers/recovery/useSendResetLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import SuccessResult from "@/pages/AccountRecoveryPage/SuccessResult";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export interface IResetPasswordFormProps {
    recoveryToken: string;
    backToSignin: () => void;
}

function ResetPasswordForm({ recoveryToken, backToSignin }: IResetPasswordFormProps): JSX.Element {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [[shouldShowPw, shouldShowConfirmPw], setShouldShowPasswords] = useState<[boolean, boolean]>([false, false]);
    const { mutate } = useRecoveryPassword();
    const [[pwError, confirmPwError], setErrors] = useState<[string | null, string | null]>([null, null]);
    const [isValidating, setIsValidating] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const passwordInput = event.currentTarget["new-password"];
        const confirmPasswordInput = event.currentTarget["new-password-confirm"];
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const errors: [string | null, string | null] = [
            !password ? "accountRecovery.errors.missing.password" : null,
            !confirmPassword ? "accountRecovery.errors.missing.confirmPassword" : null,
        ];

        if (errors[0] || errors[1]) {
            setErrors(errors);
            setIsValidating(false);
            if (errors[0]) {
                passwordInput.focus();
            } else {
                confirmPasswordInput.focus();
            }
            return;
        }

        if (password !== confirmPassword) {
            setErrors([null, "accountRecovery.errors.invalid.confirmPassword"]);
            setIsValidating(false);
            confirmPasswordInput.focus();
            return;
        }

        mutate(
            { recovery_token: recoveryToken, password },
            {
                onSuccess: () => {
                    navigate(location, { state: { isTwoSidedView: false } });
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        Toast.Add.error(t("errors.Unknown error"));
                        return;
                    }

                    switch (error.response?.status) {
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            backToSignin();
                            return;
                        case EHttpStatus.HTTP_410_GONE: {
                            const searchParams = new URLSearchParams(location.search);
                            searchParams.delete(RECOVERY_TOKEN_QUERY_NAME);

                            navigate(`${ROUTES.ACCOUNT_RECOVERY.NAME}?${searchParams.toString()}`);
                            return;
                        }
                        case EHttpStatus.HTTP_400_BAD_REQUEST:
                            setErrors(["accountRecovery.errors.missing.password", null]);
                            return;
                        default:
                            Toast.Add.error(t("errors.Internal server error"));
                            return;
                    }
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    const showIconClassName = "absolute right-2 top-1/2 -translate-y-1/2 transform cursor-pointer [&:not(:hover)]:text-gray-600 transition-all";

    if (!(location.state?.isTwoSidedView ?? true)) {
        const buttons = (
            <Button type="button" onClick={() => navigate(ROUTES.SIGN_IN.EMAIL)}>
                {t("common.Back to Sign In")}
            </Button>
        );
        return (
            <SuccessResult title={t("accountRecovery.Password Reset Successful")} buttons={buttons}>
                <p>
                    {t("accountRecovery.Your password has been successfully reset.")}&nbsp;
                    {t("accountRecovery.You can now sign in with your new password.")}
                </p>
            </SuccessResult>
        );
    } else {
        return (
            <Form.Root className="max-xs:mt-11" onSubmit={handleSubmit}>
                <Form.Field name="new-password">
                    <div className="relative">
                        <Form.Control asChild>
                            <Input
                                type={shouldShowPw ? "text" : "password"}
                                className="w-full pr-10"
                                placeholder={t("accountRecovery.New password")}
                                autoFocus
                                disabled={isValidating}
                            />
                        </Form.Control>
                        <IconComponent
                            icon={shouldShowPw ? "eye-off" : "eye"}
                            className={showIconClassName}
                            onClick={() => setShouldShowPasswords([!shouldShowPw, shouldShowConfirmPw])}
                        />
                    </div>
                    {pwError && (
                        <Form.Message>
                            <div className="mt-1 flex items-center gap-1">
                                <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                                <span className="text-sm text-red-500">{t(pwError)}</span>
                            </div>
                        </Form.Message>
                    )}
                </Form.Field>
                <Form.Field name="new-password-confirm" className="mt-3">
                    <div className="relative">
                        <Form.Control asChild>
                            <Input
                                type={shouldShowConfirmPw ? "text" : "password"}
                                className="w-full pr-10"
                                placeholder={t("accountRecovery.Confirm new password")}
                                disabled={isValidating}
                            />
                        </Form.Control>
                        <IconComponent
                            icon={shouldShowConfirmPw ? "eye-off" : "eye"}
                            className={showIconClassName}
                            onClick={() => setShouldShowPasswords([shouldShowPw, !shouldShowConfirmPw])}
                        />
                    </div>
                    {confirmPwError && (
                        <Form.Message>
                            <div className="mt-1 flex items-center gap-1">
                                <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                                <span className="text-sm text-red-500">{t(confirmPwError)}</span>
                            </div>
                        </Form.Message>
                    )}
                </Form.Field>
                <div className="mt-16 flex items-center gap-8 max-xs:justify-end xs:justify-end">
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth={3} className="animate-spin" /> : t("common.Next")}
                    </Button>
                </div>
            </Form.Root>
        );
    }
}

export default ResetPasswordForm;
