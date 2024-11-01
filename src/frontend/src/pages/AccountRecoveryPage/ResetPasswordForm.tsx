import { Button, Form, IconComponent } from "@/components/base";
import PasswordInput from "@/components/PasswordInput";
import useRecoveryPassword from "@/controllers/recovery/useRecoveryPassword";
import { RECOVERY_TOKEN_QUERY_NAME } from "@/controllers/recovery/useSendResetLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import SuccessResult from "@/pages/AccountRecoveryPage/SuccessResult";
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
                <PasswordInput
                    name="password"
                    label={t("user.New password")}
                    isFormControl
                    autoFocus
                    isValidating={isValidating}
                    error={errors.password}
                />
                <PasswordInput
                    name="password-confirm"
                    label={t("user.Confirm new password")}
                    className="mt-3"
                    isFormControl
                    isValidating={isValidating}
                    error={errors["password-confirm"]}
                />
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
