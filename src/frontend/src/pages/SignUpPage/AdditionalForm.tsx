import { Button, Form, IconComponent, Input, Select } from "@/components/base";
import { ISignUpForm } from "@/controllers/signup/useSignUp";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/core/routing/constants";

function AdditionalForm({ values, validateForm, nextStep }: ISignUpFormProps): JSX.Element {
    const industries: string[] = ["Industry 1"];
    const purposes: string[] = ["Purpose 1"];

    const { t } = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ISignUpForm, JSX.Element | null>>>({});
    const [isIndustryOther, setIsIndustryOther] = useState(values.industry && !industries.includes(values.industry));
    const [isPurposeOther, setIsPurposeOther] = useState(values.purpose && !purposes.includes(values.purpose));

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const { form, newErrors, focusElement, setValidation } = validateForm(event.currentTarget, setIsValidating);

        if (focusElement) {
            setValidation(false);
            setErrors(newErrors);
            if (focusElement instanceof RadioNodeList) {
                (focusElement[1] as HTMLInputElement).focus();
            } else {
                focusElement.focus();
            }
            return;
        }

        nextStep(form as unknown as ISignUpForm, ROUTES.SIGN_UP.OPTIONAL);
    };

    return (
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={submitForm}>
            <Form.Field name="industry">
                <Select.Root
                    autoComplete="industry"
                    disabled={isValidating}
                    name="industry"
                    onValueChange={(value) => {
                        const isOther = value === "Other";
                        setIsIndustryOther(isOther);
                    }}
                    defaultValue={values.industry && industries.includes(values.industry) ? values.industry : undefined}
                >
                    <Select.Trigger className="w-full">
                        <Select.Value placeholder={t("signUp.Industry")} />
                    </Select.Trigger>
                    <Select.Content>
                        {industries.map((industry) => (
                            <Select.Item key={industry} value={industry}>
                                {t(`signUp.industries.${industry}`)}
                            </Select.Item>
                        ))}
                        <Select.Item value="Other">{t("common.Other")}</Select.Item>
                    </Select.Content>
                </Select.Root>
                {isIndustryOther && (
                    <Form.Control asChild>
                        <Input
                            className="mt-2"
                            autoComplete="industry"
                            disabled={isValidating}
                            placeholder={t("signUp.Industry")}
                            defaultValue={values.industry && !industries.includes(values.industry) ? values.industry : undefined}
                        />
                    </Form.Control>
                )}
                {errors.industry}
            </Form.Field>
            <Form.Field name="purpose">
                <Select.Root
                    autoComplete="purpose"
                    disabled={isValidating}
                    name="purpose"
                    onValueChange={(value) => {
                        const isOther = value === "Other";
                        setIsPurposeOther(isOther);
                    }}
                    defaultValue={values.purpose && purposes.includes(values.purpose) ? values.purpose : undefined}
                >
                    <Select.Trigger className="w-full">
                        <Select.Value placeholder={t("signUp.Purpose")} />
                    </Select.Trigger>
                    <Select.Content>
                        {purposes.map((purpose) => (
                            <Select.Item key={purpose} value={purpose}>
                                {t(`signUp.purposes.${purpose}`)}
                            </Select.Item>
                        ))}
                        <Select.Item value="Other">Other</Select.Item>
                    </Select.Content>
                </Select.Root>
                {isPurposeOther && (
                    <Form.Control asChild>
                        <Input
                            className="mt-2"
                            disabled={isValidating}
                            name="purpose"
                            placeholder={t("signUp.Purpose")}
                            defaultValue={values.purpose && !purposes.includes(values.purpose) ? values.purpose : undefined}
                        />
                    </Form.Control>
                )}
                {errors.purpose}
            </Form.Field>
            <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                <Button type="button" variant="outline" onClick={() => nextStep(values, ROUTES.SIGN_UP.REQUIRED)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="submit" disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth={3} className="animate-spin" /> : t("common.Next")}
                </Button>
            </div>
        </Form.Root>
    );
}

export default AdditionalForm;
