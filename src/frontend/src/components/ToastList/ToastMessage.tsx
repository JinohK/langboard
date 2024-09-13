import IconComponent from "@/components/base/IconComponent";
import { IToast } from "@/core/stores/ToastStore";
import * as Toast from "@radix-ui/react-toast";
import { Button, Flex, IconButton } from "@radix-ui/themes";

export interface IToastMessageProps {
    id: string;
    toast: IToast;
}

function ToastMessage({ id, toast }: IToastMessageProps): JSX.Element {
    let icon: string;
    let accentColor: string;
    switch (toast.type) {
        case "error":
            icon = "x";
            accentColor = "red";
            break;
        case "info":
            icon = "info";
            accentColor = "blue";
            break;
        case "success":
            icon = "check";
            accentColor = "green";
            break;
        case "warning":
            icon = "triangle-alert";
            accentColor = "yellow";
            break;
        default:
            icon = "circle-help";
            accentColor = "gray";
            break;
    }

    return (
        <Toast.Root
            className="rt-ToastRoot"
            key={id}
            duration={toast.duration}
            toast-type={toast.type}
            data-accent-color={accentColor}
        >
            <Flex align="center" gap="3">
                <IconComponent name={toast.icon ?? icon} className="rt-ToastIcon" />
                <div>
                    <Toast.Title className="rt-ToastTitle">{toast.message}</Toast.Title>
                    {toast.details && (
                        <Toast.Description className="rt-ToastDescription">{toast.details}</Toast.Description>
                    )}
                </div>
            </Flex>
            <Flex align="center" gap="1">
                {toast.actions?.map((action, i) => (
                    <Toast.Action asChild altText={action.alt ?? ""} key={`${id}-${i}`}>
                        {action.asIcon ? (
                            <IconButton variant="ghost" data-as-block onClick={action.act}>
                                <IconComponent name={action.name} size={18} />
                            </IconButton>
                        ) : (
                            <Button variant="ghost" data-as-block onClick={action.act}>
                                {action.name}
                            </Button>
                        )}
                    </Toast.Action>
                ))}
                <Toast.Close asChild>
                    <IconButton variant="ghost" data-as-block>
                        <IconComponent name="x" size={18} />
                    </IconButton>
                </Toast.Close>
            </Flex>
        </Toast.Root>
    );
}

export default ToastMessage;
