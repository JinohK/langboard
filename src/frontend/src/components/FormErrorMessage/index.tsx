import { useTranslation } from "react-i18next";
import { Box, Flex, Form, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";

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
            <Flex items="center" gap="1" mt="1" className={wrapperClassName}>
                {icon && <IconComponent icon={icon} className="text-red-500" size="4" />}
                <Box textSize="sm" className={cn("text-red-500", messageClassName)}>
                    {t(error)}
                </Box>
            </Flex>
        </Form.Message>
    );
}

export default FormErrorMessage;
