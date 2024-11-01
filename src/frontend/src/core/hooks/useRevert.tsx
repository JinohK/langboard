import { Button, Toast } from "@/components/base";
import useRevertMutate from "@/controllers/revert/useRevertMutate";
import TypeUtils from "@/core/utils/TypeUtils";
import { useTranslation } from "react-i18next";

const useRevert = (path: string, revertCallback?: () => void) => {
    if (path.startsWith("/")) {
        path = path.slice(1);
    }

    const [t] = useTranslation();
    const { mutateAsync } = useRevertMutate(path);

    const revert = (revertKey: string, toastId?: string | number) => {
        if (!TypeUtils.isUndefined(toastId)) {
            Toast.Add.dismiss(toastId);
        }

        const promise = mutateAsync({ revert_key: revertKey });
        toastId = Toast.Add.promise(promise, {
            loading: t("common.Reverting..."),
            finally: () => {
                Toast.Add.dismiss(toastId);
                revertCallback?.();
            },
        });
    };

    const createToastButton = (revertKey: string, toastId?: () => string | number) => {
        return (
            <Button
                type="button"
                variant="outline"
                className="ml-auto h-6 px-2"
                size="sm"
                onClick={() => {
                    revert(revertKey, toastId?.());
                }}
            >
                {t("common.Undo")}
            </Button>
        );
    };

    return { revert, createToastButton };
};

export default useRevert;
