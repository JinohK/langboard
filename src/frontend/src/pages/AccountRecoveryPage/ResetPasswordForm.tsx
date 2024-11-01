import { Button, Floating, Form, IconComponent } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import useRecoveryPassword from "@/controllers/recovery/useRecoveryPassword";
import { RECOVERY_TOKEN_QUERY_NAME } from "@/controllers/recovery/useSendResetLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import SuccessResult from "@/pages/AccountRecoveryPage/SuccessResult";
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
    const [[shouldShowPw, shouldShowConfirmPw], setShouldShowPasswords] = useState<[bool, bool]>([false, false]);
    const { mutate } = useRecoveryPassword();
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "accountRecovery.errors",
        schema: {
            password: { required: true },
            "password-confirm": { required: true, sameWith: "password" },
        },
        predefineValues: { recovery_token: recoveryToken },
        mutate,
        mutateOnSuccess: () => {
            navigate(location, { state: { isTwoSidedView: false } });
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                backToSignin();
            },
            [EHttpStatus.HTTP_410_GONE]: () => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete(RECOVERY_TOKEN_QUERY_NAME);

                navigate(`${ROUTES.ACCOUNT_RECOVERY.NAME}?${searchParams.toString()}`);
            },
        },
        useDefaultBadRequestHandler: true,
    });

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
            <Form.Root className="max-xs:mt-11" onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="password">
                    <div className="relative">
                        <Floating.LabelInput
                            type={shouldShowPw ? "text" : "password"}
                            label={t("accountRecovery.New password")}
                            isFormControl
                            autoFocus
                            className="pr-10"
                            disabled={isValidating}
                        />
                        <IconComponent
                            icon={shouldShowPw ? "eye-off" : "eye"}
                            className={showIconClassName}
                            onClick={() => setShouldShowPasswords([!shouldShowPw, shouldShowConfirmPw])}
                        />
                    </div>
                    {errors.password && <FormErrorMessage error={errors.password} icon="circle-alert" />}
                </Form.Field>
                <Form.Field name="password-confirm" className="mt-3">
                    <div className="relative">
                        <Floating.LabelInput
                            type={shouldShowConfirmPw ? "text" : "password"}
                            label={t("accountRecovery.Confirm new password")}
                            isFormControl
                            className="pr-10"
                            disabled={isValidating}
                        />
                        <IconComponent
                            icon={shouldShowConfirmPw ? "eye-off" : "eye"}
                            className={showIconClassName}
                            onClick={() => setShouldShowPasswords([shouldShowPw, !shouldShowConfirmPw])}
                        />
                    </div>
                    {errors["password-confirm"] && <FormErrorMessage error={errors["password-confirm"]} icon="circle-alert" />}
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

export default ResetPasswordForm;
