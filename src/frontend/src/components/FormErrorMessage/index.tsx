import { Form, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

export interface IFormErrorMessageProps {
    error: string;
    icon?: string;
    wrapperClassName?: string;
    messageClassName?: string;
}

function FormErrorMessage({ error, icon, wrapperClassName, messageClassName }: IFormErrorMessageProps): JSX.Element | null {
    const [t] = useTranslation();

    return (
        <Form.Message>
            <div className={cn("mt-1 flex items-center gap-1", wrapperClassName)}>
                {icon && <IconComponent icon={icon} className="text-red-500" size="4" />}
                <span className={cn("text-sm text-red-500", messageClassName)}>{t(error)}</span>
            </div>
        </Form.Message>
    );
}

export default FormErrorMessage;
