import { Button, IconComponent, Toast } from "@/components/base";
import useCreateWiki from "@/controllers/api/wiki/useCreateWiki";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiCreateButtonProps {
    changeTab: (uid: string) => void;
}

const WikiCreateButton = memo(({ changeTab }: IWikiCreateButtonProps) => {
    const { projectUID, setWikis, wikiTabListId } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: createWikiMutateAsync } = useCreateWiki();

    const createWiki = () => {
        const promise = createWikiMutateAsync({
            project_uid: projectUID,
            title: "New page",
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Creating..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
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
                setWikis((prev) => [...prev, data.wiki]);
                setTimeout(() => {
                    const wikiTabList = document.getElementById(wikiTabListId)!;
                    wikiTabList.scrollTo({
                        left: wikiTabList.scrollWidth,
                        behavior: "smooth",
                    });
                    changeTab(data.wiki.uid);
                }, 0);
                return t("wiki.successes.New wiki page created successfully.");
            },
            finally: () => {
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Button variant="ghost" size="icon-sm" title={t("wiki.New wiki page")} titleAlign="end" onClick={createWiki}>
            <IconComponent icon="plus" size="4" />
        </Button>
    );
});

export default WikiCreateButton;
