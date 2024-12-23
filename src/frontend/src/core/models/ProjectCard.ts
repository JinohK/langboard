import * as ProjectCardAttachment from "@/core/models/ProjectCardAttachment";
import * as ProjectCheckitem from "@/core/models/ProjectCheckitem";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import * as User from "@/core/models/User";
import { IBaseModel, IEditorContent } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    column_uid: string;
    title: string;
    description?: IEditorContent;
    order: number;
}

export interface IBoard extends Interface {
    count_comment: number;
    members: User.Interface[];
    labels: string[];
    relationships: {
        parents: string[];
        children: string[];
    };
}

export interface IBoardWithDetails extends Interface {
    deadline_at?: Date;
    column_name: string;
    project_all_columns: ProjectColumn.Interface[];
    members: User.Interface[];
    project_members: User.Interface[];
    project_labels: ProjectLabel.Interface[];
    labels: ProjectLabel.Interface[];
    relationships: {
        parent_icon?: string;
        parent_name: string;
        child_icon?: string;
        child_name: string;
        description: string;
        is_parent: bool;
        related_card: Interface;
    }[];
    attachments: ProjectCardAttachment.IBoard[];
    checkitems: ProjectCheckitem.IBoard[];
    is_archived: bool;
}
