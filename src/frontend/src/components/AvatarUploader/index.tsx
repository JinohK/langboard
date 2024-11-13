import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { VariantProps } from "tailwind-variants";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Avatar, Dock, Flex, Form, IconComponent, Input, Tooltip } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";

export interface IAvatarUploaderProps {
    name?: string;
    userInitials: string;
    errorMessage?: string;
    initialAvatarUrl?: string;
    dataTransferRef: React.MutableRefObject<DataTransfer>;
    avatarUrlRef?: React.MutableRefObject<string | undefined>;
    isDeletedRef?: React.MutableRefObject<bool>;
    isValidating?: bool;
    canRevertUrl?: bool;
    avatarSize?: VariantProps<typeof AvatarVariants>["size"];
    hideDock?: bool;
}

function AvatarUploader({
    name = "avatar",
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
}: IAvatarUploaderProps): JSX.Element {
    const [t] = useTranslation();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleUpload = useCallback((files: File[] | FileList) => {
        if (!files.length) {
            if (initialAvatarUrl && !isDeletedRef?.current) {
                if (avatarUrlRef) {
                    avatarUrlRef.current = initialAvatarUrl;
                }
                setAvatarUrl(initialAvatarUrl);
            } else {
                if (avatarUrlRef) {
                    avatarUrlRef.current = undefined;
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
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        onDrop: handleUpload,
        onFileDialogCancel: () => handleUpload([]),
    });

    const removeAvatar = () => {
        if (isValidating) {
            return;
        }

        if (isDeletedRef) {
            isDeletedRef.current = true;
        }
        dataTransferRef.current.items.clear();
        if (avatarUrlRef) {
            avatarUrlRef.current = undefined;
        }
        setAvatarUrl(undefined);
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

    return (
        <div className="relative">
            <Form.Field {...getRootProps({ name })}>
                <Flex justify="center" className="relative cursor-pointer transition-all duration-200 hover:opacity-80">
                    {isDragActive && (
                        <Flex
                            items="center"
                            justify="center"
                            size="full"
                            className="absolute left-0 top-0 z-50 border-2 border-dashed border-primary bg-background"
                        >
                            {t("user.Drop avatar here")}
                        </Flex>
                    )}
                    <Tooltip.Provider delayDuration={400}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <Avatar.Root size={avatarSize} onClick={() => !isValidating && inputRef.current?.click()}>
                                    <Avatar.Image src={avatarUrl} alt="" />
                                    <Avatar.Fallback className="text-4xl">{userInitials}</Avatar.Fallback>
                                </Avatar.Root>
                            </Tooltip.Trigger>
                            <Tooltip.Content side="bottom">{t("user.Upload avatar")}</Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                    <Form.Control asChild>
                        <Input className="hidden" disabled={isValidating} {...getInputProps()} ref={inputRef} />
                    </Form.Control>
                </Flex>
                {errorMessage && <FormErrorMessage error={errorMessage} icon="circle-alert" wrapperClassName="justify-center" />}
            </Form.Field>
            {!hideDock && (
                <Dock.Root direction="middle" magnification={50} distance={100} size="sm">
                    <Dock.IconButton
                        buttonProps={{ type: "button", className: "p-3", onClick: () => !isValidating && inputRef.current?.click() }}
                        dockIconProps={{ className: "bg-accent/70 transition-colors duration-300 hover:text-primary" }}
                        title={t("user.Upload avatar")}
                        titleSide="bottom"
                        icon="upload"
                    />
                    {canRevertUrl && avatarUrl !== initialAvatarUrl && (
                        <Dock.IconButton
                            buttonProps={{ type: "button", className: "p-3", onClick: revertUrl }}
                            dockIconProps={{ className: "bg-accent/70 transition-colors duration-300 hover:text-primary" }}
                            title={t("user.Revert avatar")}
                            titleSide="bottom"
                            icon="undo-2"
                        />
                    )}
                    {avatarUrl && (
                        <Dock.Icon className="bg-accent/70 text-red-500 transition-colors duration-300 hover:text-red-700">
                            <Tooltip.Provider delayDuration={400} disableHoverableContent>
                                <Tooltip.Root>
                                    <Tooltip.Trigger className="p-3" type="button">
                                        <IconComponent icon="trash-2" className="size-full" onClick={removeAvatar} />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content side="bottom">{t("user.Delete avatar")}</Tooltip.Content>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        </Dock.Icon>
                    )}
                </Dock.Root>
            )}
        </div>
    );
}

export default AvatarUploader;
