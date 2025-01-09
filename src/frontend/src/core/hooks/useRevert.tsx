/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import { Button, Toast } from "@/components/base";
import useRevertMutate from "@/controllers/api/revert/useRevertMutate";
import TypeUtils from "@/core/utils/TypeUtils";

function useRevert<TData = any>(path: string, revertCallback?: (dataBeforeUpdated: TData) => void) {
    if (path.startsWith("/")) {
        path = path.slice(1);
    }

    const [t] = useTranslation();
    const { mutateAsync } = useRevertMutate(path);

    const createToastCreator = (revertKey: string, dataBeforeUpdated: TData) => {
        return (message: string) => {
            const toastId = Toast.Add.success(message, {
                actions: [
                    createToastButton(
                        revertKey,
                        () => toastId,
                        () => {
                            revertCallback?.(dataBeforeUpdated);
                        }
                    ),
                ],
            });
        };
    };

    const createToastButton = (revertKey: string, toastId?: () => string | number, callback?: () => void) => {
        return (
            <Button
                type="button"
                variant="outline"
                className="ml-auto h-6 px-2"
                size="sm"
                onClick={() => {
                    revert(revertKey, toastId?.(), callback);
                }}
            >
                {t("common.Undo")}
            </Button>
        );
    };

    const revert = (revertKey: string, toastId?: string | number, callback?: () => void) => {
        if (!TypeUtils.isUndefined(toastId)) {
            Toast.Add.dismiss(toastId);
        }

        const promise = mutateAsync({ revert_key: revertKey });
        toastId = Toast.Add.promise(promise, {
            loading: t("common.Reverting..."),
            finally: () => {
                Toast.Add.dismiss(toastId);
                callback?.();
            },
        });
    };

    return { revert, createToastButton, createToastCreator };
}

export default useRevert;
