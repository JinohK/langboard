import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { VariantProps } from "tailwind-variants";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Avatar, Box, Dock, Flex, Form, IconComponent, Input, Tooltip } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";

interface IBaseAvatarUploaderProps {
    name?: string;
    isBot?: bool;
    userInitials?: string;
    errorMessage?: string;
    initialAvatarUrl?: string;
    dataTransferRef: React.RefObject<DataTransfer>;
    avatarUrlRef?: React.RefObject<string | null>;
    isDeletedRef?: React.RefObject<bool>;
    isValidating?: bool;
    canRevertUrl?: bool;
    avatarSize?: VariantProps<typeof AvatarVariants>["size"];
    hideDock?: bool;
    notInForm?: bool;
    rootClassName?: string;
    onChange?: (files: File[] | FileList) => void;
    onDeleted?: () => void;
}

interface IUserAvatarUploaderProps extends IBaseAvatarUploaderProps {
    isBot?: false;
    userInitials: string;
}

interface IBotAvatarUploaderProps extends IBaseAvatarUploaderProps {
    isBot: true;
    userInitials?: never;
}

export type TAvatarUploaderProps = IUserAvatarUploaderProps | IBotAvatarUploaderProps;

function AvatarUploader({
    name = "avatar",
    isBot,
    userInitials,
    initialAvatarUrl,
    dataTransferRef,
    avatarUrlRef,
    isDeletedRef,
    isValidating,
    errorMessage,
    canRevertUrl = false,
    avatarSize = "2xl",
    hideDock = false,
    notInForm,
    rootClassName,
    onChange,
    onDeleted,
}: TAvatarUploaderProps): JSX.Element {
    const [t] = useTranslation();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
    const handleUpload = useCallback((files: File[] | FileList) => {
        if (!files.length) {
            if (initialAvatarUrl && !isDeletedRef?.current) {
                if (avatarUrlRef) {
                    avatarUrlRef.current = initialAvatarUrl;
                }
                setAvatarUrl(initialAvatarUrl);
            } else {
                if (avatarUrlRef) {
                    avatarUrlRef.current = null;
                }
                setAvatarUrl(undefined);
            }
            dataTransferRef.current.items.clear();
            return;
        }

        const file = files[0];
        dataTransferRef.current.items.add(file);

        const reader = new FileReader();
        reader.onload = () => {
            if (avatarUrlRef) {
                avatarUrlRef.current = reader.result as string;
            }
            setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        onChange?.(files);
    }, []);
    const { getRootProps, getInputProps, inputRef, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        onDrop: handleUpload,
        onFileDialogCancel: () => handleUpload([]),
    });
    const [bgColor, textColor] = isBot ? ["", ""] : new Utils.Color.Generator(userInitials).generateAvatarColor();

    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    const removeAvatar = () => {
        if (isValidating) {
            return;
        }

        if (isDeletedRef) {
            isDeletedRef.current = true;
        }
        dataTransferRef.current.items.clear();
        if (avatarUrlRef) {
            avatarUrlRef.current = null;
        }
        setAvatarUrl(undefined);
        onDeleted?.();
    };

    const revertUrl = () => {
        if (isValidating) {
            return;
        }

        if (isDeletedRef) {
            isDeletedRef.current = false;
        }
        setAvatarUrl(initialAvatarUrl);
    };

    useEffect(() => {
        setAvatarUrl(initialAvatarUrl);
    }, [initialAvatarUrl]);

    const avatar = (
        <>
            <Flex justify="center" position="relative" cursor="pointer" className="transition-all duration-200 hover:opacity-80">
                <Avatar.Root size={avatarSize}>
                    <Avatar.Image src={avatarUrl} alt="" />
                    <Avatar.Fallback style={styles} className={cn("text-4xl", !isBot && "bg-[--avatar-bg] text-[--avatar-text-color]")}>
                        {isBot ? <IconComponent icon="bot" className="size-2/3" /> : userInitials}
                    </Avatar.Fallback>
                </Avatar.Root>
                <Input
                    wrapperProps={{ className: "hidden" }}
                    disabled={isValidating}
                    {...getInputProps()}
                    isFormControl={!notInForm}
                    ref={inputRef}
                />
            </Flex>
            {errorMessage && <FormErrorMessage error={errorMessage} icon="circle-alert" wrapperClassName="justify-center" notInForm={notInForm} />}
        </>
    );

    return (
        <Box position="relative" w="full" className={rootClassName} {...getRootProps()}>
            {isDragActive && (
                <Flex
                    items="center"
                    justify="center"
                    size="full"
                    position="absolute"
                    left="0"
                    top="0"
                    z="50"
                    className="border-2 border-dashed border-primary bg-background/70"
                >
                    {t("user.Drop avatar here")}
                </Flex>
            )}
            {!notInForm ? <Form.Field name={name}>{avatar}</Form.Field> : <Box>{avatar}</Box>}
            {!hideDock && (
                <Dock.Root direction="middle" magnification={50} distance={100} size="sm">
                    <Dock.Button
                        buttonProps={{ type: "button", className: "p-3", onClick: () => !isValidating && inputRef.current?.click() }}
                        dockIconProps={{ className: "bg-accent/70 transition-colors duration-300 hover:text-primary" }}
                        title={t("user.Upload avatar")}
                        titleSide="bottom"
                        icon="upload"
                    />
                    {canRevertUrl && avatarUrl !== initialAvatarUrl && (
                        <Dock.Button
                            buttonProps={{ type: "button", className: "p-3", onClick: revertUrl }}
                            dockIconProps={{ className: "bg-accent/70 transition-colors duration-300 hover:text-primary" }}
                            title={t("user.Revert avatar")}
                            titleSide="bottom"
                            icon="undo-2"
                        />
                    )}
                    {avatarUrl && (
                        <Dock.Icon className="bg-accent/70 text-red-500 transition-colors duration-300 hover:text-red-700">
                            <Tooltip.Root disableHoverableContent>
                                <Tooltip.Trigger className="p-3" type="button">
                                    <IconComponent icon="trash-2" className="size-full" onClick={removeAvatar} />
                                </Tooltip.Trigger>
                                <Tooltip.Content side="bottom">{t("user.Delete avatar")}</Tooltip.Content>
                            </Tooltip.Root>
                        </Dock.Icon>
                    )}
                </Dock.Root>
            )}
        </Box>
    );
}

export default AvatarUploader;
