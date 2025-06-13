import { Floating, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelMoreChangeDescription(): JSX.Element {
    const { project } = useBoardSettings();
    const { model: label } = ModelRegistry.ProjectLabel.useContext();
    const [t] = useTranslation();
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("description");

    const changeLabelDescription = (endCallback: (shouldClose: bool) => void) => {
        if (!descriptionInputRef.current) {
            endCallback(false);
            return;
        }

        const newValue = descriptionInputRef.current.value.trim();

        if (!newValue) {
            Toast.Add.error(t("project.settings.errors.Description cannot be empty."));
            endCallback(false);
            descriptionInputRef.current.focus();
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            description: newValue,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Description changed successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem modal menuName={t("project.settings.Change description")} onSave={changeLabelDescription}>
            <BoardSettingsLabelMoreChangeDescriptionForm descriptionInputRef={descriptionInputRef} />
        </MoreMenu.PopoverItem>
    );
}

interface IBoardSettingsLabelMoreChangeDescriptionFormProps {
    descriptionInputRef: React.Ref<HTMLInputElement>;
}

function BoardSettingsLabelMoreChangeDescriptionForm({ descriptionInputRef }: IBoardSettingsLabelMoreChangeDescriptionFormProps): JSX.Element {
    const [t] = useTranslation();
    const { model: label } = ModelRegistry.ProjectLabel.useContext();
    const { save } = MoreMenu.useMoreMenuItem();
    const labelDescription = label.useField("description");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            save();
        }
    };

    return (
        <Floating.LabelInput
            label={t("project.settings.Description")}
            defaultValue={labelDescription}
            onKeyDown={handleKeyDown}
            ref={descriptionInputRef}
        />
    );
}

export default BoardSettingsLabelMoreChangeDescription;
