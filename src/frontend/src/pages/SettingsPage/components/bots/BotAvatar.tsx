import { Avatar, DropdownMenu, Flex, IconComponent, Input, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotAvatarProps {
    bot: BotModel.TModel;
}

const BotAvatar = memo(({ bot }: IBotAvatarProps) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const avatar = bot.useField("avatar");
    const { navigate, isValidating, setIsValidating } = useAppSetting();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync } = useUpdateBot(bot);

    const onChange = () => {
        if (isValidating || !fileInputRef.current) {
            return;
        }

        setIsValidating(true);

        const file = fileInputRef.current.files![0];
        const hasAvatar = !!avatar;

        const promise = mutateAsync({
            avatar: file,
        });

        showToast(promise, () => {
            if (hasAvatar) {
                return t("settings.successes.Bot avatar changed successfully.");
            } else {
                return t("settings.successes.Bot avatar uploaded successfully.");
            }
        });
    };

    const onDeleted = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            delete_avatar: true,
        });

        showToast(promise, () => {
            return t("settings.successes.Bot avatar deleted successfully.");
        });
    };

    const showToast = (promise: Promise<unknown>, onSuccess: () => string) => {
        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                        navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: onSuccess,
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
            },
        });
    };

    return (
        <Flex items="center" direction="col" gap="2">
            <Input type="file" accept="image/*" onChange={onChange} className="hidden" disabled={isValidating} ref={fileInputRef} />
            <DropdownMenu.Root open={isOpened} onOpenChange={setIsOpened}>
                <DropdownMenu.Trigger asChild disabled={isValidating}>
                    <Avatar.Root className="cursor-pointer transition-all duration-200 hover:opacity-80">
                        <Avatar.Image src={avatar} />
                        <Avatar.Fallback>
                            <IconComponent icon="bot" className="size-2/3" />
                        </Avatar.Fallback>
                    </Avatar.Root>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start">
                    <DropdownMenu.Item
                        className="flex"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        {t(avatar ? "common.Change" : "common.Upload")}
                    </DropdownMenu.Item>
                    {avatar && (
                        <DropdownMenu.Item
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleted();
                            }}
                        >
                            {t("common.Delete")}
                        </DropdownMenu.Item>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </Flex>
    );
});

export default BotAvatar;
