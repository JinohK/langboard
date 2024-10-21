import { Form, IconComponent } from "@/components/base";
import { useTranslation } from "react-i18next";

export interface IErrorMessageProps {
    error: string;
}

function ErrorMessage({ error }: IErrorMessageProps): JSX.Element | null {
    const [t] = useTranslation();

    return (
        <Form.Message>
            <div className="mt-1 flex items-center gap-1">
                <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                <span className="text-sm text-red-500">{t(error)}</span>
            </div>
        </Form.Message>
    );
}

export default ErrorMessage;
