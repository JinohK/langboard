import { Button, ButtonProps, Dialog, DropdownMenu, Flex, SubmitButton } from "@/components/base";
import { MoreMenuItemProvider, useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMoreMenuDialogItemProps {
    modal?: bool;
    menuName: React.ReactNode;
    contentProps?: React.ComponentProps<typeof Dialog.Content>;
    saveButtonProps?: Omit<ButtonProps, "type">;
    cancelButtonProps?: ButtonProps;
    saveText?: string;
    onSave: (endCallback: (shouldClose: bool) => void) => void;
    onOpenChange?: (opened: bool) => void;
    children?: React.ReactNode;
}

function MoreMenuDialogItem({ onSave, onOpenChange, ...props }: IMoreMenuDialogItemProps): JSX.Element {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <MoreMenuItemProvider isOpened={isOpened} setIsOpened={setIsOpened} onSave={onSave} onOpenChange={onOpenChange}>
            <MoreMenuDialogItemDisplay {...props} />
        </MoreMenuItemProvider>
    );
}

function MoreMenuDialogItemDisplay({
    modal,
    menuName,
    contentProps,
    saveButtonProps,
    cancelButtonProps,
    saveText,
    children,
}: Omit<IMoreMenuDialogItemProps, "onSave" | "onOpenChange">): JSX.Element {
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
        <Dialog.Root modal={modal} open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Trigger asChild>
                <DropdownMenu.Item onClick={handleOpen}>{menuName}</DropdownMenu.Item>
            </Dialog.Trigger>
            <Dialog.Content {...contentProps}>
                <Dialog.Title hidden />
                <Dialog.Description hidden />
                {children}
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={handleClose} {...cancelButtonProps}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating} {...saveButtonProps}>
                        {saveText ?? t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MoreMenuDialogItem;
