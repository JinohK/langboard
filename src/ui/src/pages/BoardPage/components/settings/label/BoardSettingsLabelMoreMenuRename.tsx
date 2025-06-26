import { Floating, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelMoreMenuRename(): JSX.Element {
    const { model: label } = ModelRegistry.ProjectLabel.useContext();
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("name", { interceptToast: true });
    const nameInputRef = useRef<HTMLInputElement>(null);

    const changeLabelName = (endCallback: (shouldClose: bool) => void) => {
        if (!nameInputRef.current) {
            endCallback(false);
            return;
        }

        const newValue = nameInputRef.current.value.trim();

        if (!newValue) {
            Toast.Add.error(t("project.settings.errors.Label name cannot be empty."));
            endCallback(false);
            nameInputRef.current.focus();
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            name: newValue,
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
                return t("successes.Label name changed successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem modal menuName={t("project.settings.Rename")} onSave={changeLabelName}>
            <BoardSettingsLabelMoreMenuRenameForm nameInputRef={nameInputRef} />
        </MoreMenu.PopoverItem>
    );
}

interface IBoardSettingsLabelMoreMenuRenameFormProps {
    nameInputRef: React.Ref<HTMLInputElement>;
}

function BoardSettingsLabelMoreMenuRenameForm({ nameInputRef }: IBoardSettingsLabelMoreMenuRenameFormProps): JSX.Element {
    const [t] = useTranslation();
    const { model: label } = ModelRegistry.ProjectLabel.useContext();
    const { save } = MoreMenu.useMoreMenuItem();
    const labelName = label.useField("name");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            save();
        }
    };

    return <Floating.LabelInput label={t("project.settings.Label name")} defaultValue={labelName} ref={nameInputRef} onKeyDown={handleKeyDown} />;
}

export default BoardSettingsLabelMoreMenuRename;
