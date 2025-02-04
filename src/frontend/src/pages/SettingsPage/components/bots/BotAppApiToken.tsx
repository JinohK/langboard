import { Box, Button, Dialog, Flex, Floating, IconComponent, Input, Toast } from "@/components/base";
import useGenerateNewBotApiToken from "@/controllers/api/settings/bots/useGenerateNewBotApiToken";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotAppApiTokenProps {
    bot: BotModel.TModel;
}

const BotAppApiToken = memo(({ bot }: IBotAppApiTokenProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const appApiToken = bot.useField("app_api_token");
    const { mutateAsync } = useGenerateNewBotApiToken(bot);
    const [isValidating, setIsValidating] = useState(false);
    const [opened, setOpened] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string>();
    const [isCopied, setIsCopied] = useState(false);

    const generate = () => {
        if (isValidating) {
            return;
        }

        const promise = mutateAsync({});

        Toast.Add.promise(promise, {
            loading: t("common.Refreshing..."),
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
            success: (data) => {
                setTimeout(() => {
                    setRevealedToken(data.revealed_app_api_token);
                    setOpened(true);
                }, 0);
                return t("settings.successes.Bot App API token generated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        setRevealedToken(undefined);
        setOpened(opened);
    };

    const copyToken = (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if (!revealedToken) {
            return;
        }

        selectAllText(e.currentTarget);
        copyToClipboard(revealedToken);
        setIsCopied(true);
    };

    return (
        <>
            <Flex items="center" justify="between" gap="2">
                <Floating.LabelInput
                    label={t("settings.Bot App API token")}
                    autoComplete="off"
                    defaultValue={appApiToken}
                    wrapperClassNames="max-w-[calc(100%_-_theme(spacing.10))] w-full"
                    disabled
                />
                <Button size="icon-sm" onClick={generate} title={t("settings.Generate new API token")}>
                    <IconComponent icon="refresh-ccw" size="4" />
                </Button>
            </Flex>
            <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
                <Dialog.Content className="sm:max-w-md" aria-describedby="">
                    <Dialog.Header>
                        <Dialog.Title>{t("settings.Generated new token")}</Dialog.Title>
                    </Dialog.Header>
                    <Box position="relative" mt="4">
                        <Input
                            value={revealedToken}
                            onFocus={copyToken}
                            onClick={copyToken}
                            readOnly
                            className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""}
                        />
                        {isCopied && <IconComponent icon="check" size="5" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                    </Box>
                    <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                        <Dialog.Close asChild>
                            <Button type="button" variant={!revealedToken ? "destructive" : "outline"} disabled={isValidating}>
                                {t(!revealedToken ? "common.Cancel" : "common.Close")}
                            </Button>
                        </Dialog.Close>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
});

export default BotAppApiToken;
