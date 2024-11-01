import { AutoComplete, Button, Form, IconComponent, Input } from "@/components/base";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/core/routing/constants";
import { User } from "@/core/models";
import useForm from "@/core/hooks/form/useForm";
import FormErrorMessage from "@/components/FormErrorMessage";
import { ISignUpForm } from "@/controllers/signup/useSignUp";
import { setInitialErrorsWithFocusingElement } from "@/pages/SignUpPage/utils";

function AdditionalForm({ values, moveStep, initialErrorsRef }: ISignUpFormProps): JSX.Element {
    const { t } = useTranslation();
    const industryRef = useRef<string>(values.industry ?? "");
    const industryInputRef = useRef<HTMLInputElement | null>(null);
    const purposeRef = useRef<string>(values.purpose ?? "");
    const purposeInputRef = useRef<HTMLInputElement | null>(null);
    const { errors, setErrors, isValidating, handleSubmit, formRef } = useForm<Pick<ISignUpForm, "industry" | "purpose">>({
        errorLangPrefix: "signUp.errors",
        schema: {
            industry: { required: true },
            purpose: { required: true },
        },
        successCallback: (data) => {
            moveStep(
                {
                    ...values,
                    ...data,
                },
                ROUTES.SIGN_UP.OPTIONAL
            );
        },
    });

    useEffect(() => {
        setInitialErrorsWithFocusingElement(["industry", "purpose"], initialErrorsRef, setErrors, formRef);
    }, []);

    const setIndustry = (value: string) => {
        industryRef.current = value;
        industryInputRef.current!.value = value;
    };

    const setPurpose = (value: string) => {
        purposeRef.current = value;
        purposeInputRef.current!.value = value;
    };

    return (
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={handleSubmit} ref={formRef}>
            <Form.Field name="industry">
                <Input type="hidden" name="industry" value={industryRef.current} ref={industryInputRef} />
                <AutoComplete
                    selectedValue={values.industry}
                    onValueChange={setIndustry}
                    items={User.INDUSTRIES.map((industry) => ({ value: industry, label: `signUp.industries.${industry}` }))}
                    emptyMessage={industryRef.current ?? ""}
                    placeholder={t("user.What industry are you in?")}
                />
                {errors.industry && <FormErrorMessage error={errors.industry} icon="circle-alert" />}
            </Form.Field>
            <Form.Field name="purpose">
                <Input type="hidden" name="purpose" value={purposeRef.current} ref={purposeInputRef} />
                <AutoComplete
                    selectedValue={values.purpose}
                    onValueChange={setPurpose}
                    items={User.PURPOSES.map((purpose) => ({ value: purpose, label: `signUp.purposes.${purpose}` }))}
                    emptyMessage={purposeRef.current ?? ""}
                    placeholder={t("user.What is your purpose for using {app}?")}
                />
                {errors.purpose && <FormErrorMessage error={errors.purpose} icon="circle-alert" />}
            </Form.Field>
            <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                <Button type="button" variant="outline" onClick={() => moveStep(values, ROUTES.SIGN_UP.REQUIRED)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="submit" disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                </Button>
            </div>
        </Form.Root>
    );
}

export default AdditionalForm;
