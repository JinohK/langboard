import { Button, ButtonProps, DropdownMenu, IconComponent } from "@/components/base";
import { MoreMenuProvider } from "@/components/MoreMenu/Provider";
import useHandleInteractOutside from "@/core/hooks/useHandleInteractOutside";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMoreMenuRootProps {
    modal?: bool;
    triggerProps?: ButtonProps;
    contentProps?: React.ComponentProps<typeof DropdownMenu.Content>;
    children: React.ReactNode;
}

function MoreMenuRoot({ modal, triggerProps, contentProps, children }: IMoreMenuRootProps): JSX.Element {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { onInteractOutside, onPointerDownOutside } = useHandleInteractOutside({ pointerDownOutside: () => setIsOpened(false) }, [setIsOpened]);
    const { variant = "ghost", size = "icon-sm" } = triggerProps || {};

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }
        setIsOpened(opened);
    };

    return (
        <MoreMenuProvider isValidating={isValidating} setIsValidating={setIsValidating} isOpened={isOpened} setIsOpened={setIsOpened}>
            <DropdownMenu.Root modal={modal} open={isOpened} onOpenChange={changeOpenedState}>
                <DropdownMenu.Trigger asChild>
                    <Button type="button" variant={variant} size={size} title={t("common.More")} {...triggerProps}>
                        <IconComponent icon="ellipsis-vertical" size="4" />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" onInteractOutside={onInteractOutside} onPointerDownOutside={onPointerDownOutside} {...contentProps}>
                    <DropdownMenu.Group>{children}</DropdownMenu.Group>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </MoreMenuProvider>
    );
}

export default MoreMenuRoot;
