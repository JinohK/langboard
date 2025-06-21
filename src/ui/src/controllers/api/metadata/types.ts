import { MetadataModel } from "@/core/models";

interface IBaseMetadataForm<T extends MetadataModel.TType> {
    type: T;
    uid: string;
}

interface ICardMetadataForm extends IBaseMetadataForm<"card"> {
    project_uid: string;
}

interface IProjectWikiMetadataForm extends IBaseMetadataForm<"project_wiki"> {
    project_uid: string;
}

export type TMetadataForm = ICardMetadataForm | IProjectWikiMetadataForm;
