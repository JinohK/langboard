import { SubmitButton, Toast } from "@/components/base";
import useCreateProjectLabel from "@/controllers/api/board/settings/useCreateProjectLabel";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelAddButton() {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: createProjectLabelMutateAsync } = useCreateProjectLabel();

    const createLabel = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = createProjectLabelMutateAsync({
            project_uid: project.uid,
            name: "New Label",
            color: new ColorGenerator(createShortUUID()).generateRandomColor(),
            description: "Sample label description",
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error: unknown) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("project.errors.Project not found.");
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
            success: () => {
                return t("project.settings.successes.Label added successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <SubmitButton type="button" isValidating={isValidating} variant="outline" className="w-full border-2 border-dashed" onClick={createLabel}>
            {t("project.settings.Add a label")}
        </SubmitButton>
    );
}

export default BoardSettingsLabelAddButton;
