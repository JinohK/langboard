import { Button, ButtonProps, DropdownMenu, Flex, Popover, SubmitButton } from "@/components/base";
import { MoreMenuItemProvider, useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMoreMenuPopoverItemProps {
    modal?: bool;
    menuName: React.ReactNode;
    contentProps?: React.ComponentProps<typeof Popover.Content>;
    saveButtonProps?: Omit<ButtonProps, "type">;
    cancelButtonProps?: ButtonProps;
    saveText?: string;
    onSave: (endCallback: (shouldClose: bool) => void) => void;
    onOpenChange?: (opened: bool) => void;
    children?: React.ReactNode;
}

function MoreMenuPopoverItem({ onSave, onOpenChange, ...props }: IMoreMenuPopoverItemProps): JSX.Element {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <MoreMenuItemProvider isOpened={isOpened} setIsOpened={setIsOpened} onSave={onSave} onOpenChange={onOpenChange}>
            <MoreMenuPopoverItemInner {...props} />
        </MoreMenuItemProvider>
    );
}

function MoreMenuPopoverItemInner({
    modal,
    menuName,
    contentProps,
    saveButtonProps,
    cancelButtonProps,
    saveText,
    children,
}: Omit<IMoreMenuPopoverItemProps, "onSave" | "onOpenChange">): JSX.Element {
    const [t] = useTranslation();
    const { isOpened, setIsOpened, save } = useMoreMenuItem();
    const { isValidating } = useMoreMenu();

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    const handleClose = () => {
        setIsOpened(false);
    };

    return (
        <Popover.Root modal={modal} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item onClick={handleOpen}>{menuName}</DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end" {...contentProps}>
                <Flex direction="col" gap="2">
                    {children}
                    <Flex items="center" justify="end" gap="1" mt="2">
                        <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={handleClose} {...cancelButtonProps}>
                            {t("common.Cancel")}
                        </Button>
                        <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating} {...saveButtonProps}>
                            {saveText ?? t("common.Save")}
                        </SubmitButton>
                    </Flex>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default MoreMenuPopoverItem;
