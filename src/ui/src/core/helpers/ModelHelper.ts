import {
    AuthUser,
    ActivityModel,
    ChatMessageModel,
    Project,
    ProjectCard,
    ProjectCardAttachment,
    ProjectCardComment,
    ProjectCardRelationship,
    ProjectChecklist,
    ProjectCheckitem,
    ProjectColumn,
    ProjectLabel,
    ProjectWiki,
    User,
    MetadataModel,
    ProjectColumnBotScope,
    ProjectCardBotScope,
    ProjectColumnBotSchedule,
    ProjectCardBotSchedule,
} from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { ESocketTopic } from "@langboard/core/enums";

export const deleteProjectModel = (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, projectUID: string) => {
    const socket = useSocketOutsideProvider();

    const project = Project.Model.getModel(projectUID);
    if (!project) {
        return;
    }

    socket.unsubscribe(topic, [projectUID]);

    const currentUser = AuthUser.Model.currentUser;

    const subscribedTopics = {
        [ESocketTopic.BoardCard]: [] as string[],
        [ESocketTopic.BoardWiki]: [] as string[],
    };

    ActivityModel.Model.deleteModels((model) => model.filterable_type === "project" && model.filterable_uid === projectUID);
    ChatMessageModel.Model.deleteModels((model) => model.filterable_table === "project" && model.filterable_uid === projectUID);
    ChatMessageModel.Model.deleteModels((model) => model.filterable_table === "project" && model.filterable_uid === projectUID);
    ProjectWiki.Model.deleteModels((model) => {
        MetadataModel.Model.deleteModels((metadataModel) => metadataModel.uid === model.uid);
        if (model.project_uid !== projectUID) {
            return false;
        }

        if (socket.isSubscribed(ESocketTopic.BoardWiki, model.uid)) {
            subscribedTopics[ESocketTopic.BoardWiki].push(model.uid);
        }

        return true;
    });
    ProjectColumn.Model.getModels((model) => {
        if (model.project_uid !== projectUID) {
            return false;
        }

        deleteProjectColumnModel(model.uid);
        return true;
    });
    ProjectLabel.Model.deleteModels((model) => model.project_uid === projectUID);
    ProjectCard.Model.getModels((model) => {
        if (model.project_uid !== projectUID) {
            return false;
        }

        if (socket.isSubscribed(ESocketTopic.BoardCard, model.uid)) {
            subscribedTopics[ESocketTopic.BoardCard].push(model.uid);
        }

        deleteCardModel(model.uid, false);
        return false;
    });
    const userGroupUIDs = currentUser.user_groups.map((group) => group.users.map((user) => user.uid)).flat();
    const memberUIDs = project.all_members
        .map((member) => member.uid)
        .filter((memberUID) => currentUser.uid !== memberUID && !userGroupUIDs.includes(memberUID));
    User.Model.deleteModels((model) => memberUIDs.includes(model.uid));
    Project.Model.deleteModel(projectUID);

    Object.entries(subscribedTopics).forEach(([topic, uids]) => {
        if (uids.length) {
            socket.unsubscribe(topic, uids);
        }
    });
};

export const deleteCardModel = (cardUID: string, shouldUnsubscribe: bool) => {
    const socket = useSocketOutsideProvider();

    const card = ProjectCard.Model.getModel(cardUID);
    if (!card) {
        return;
    }

    ProjectCardAttachment.Model.deleteModels((attachment) => attachment.card_uid === cardUID);
    ProjectCardComment.Model.deleteModels((comment) => comment.card_uid === cardUID);
    ProjectCardRelationship.Model.deleteModels((relationship) => relationship.parent_card_uid === cardUID || relationship.child_card_uid === cardUID);
    ProjectChecklist.Model.deleteModels((checklist) => checklist.card_uid === cardUID);
    ProjectCheckitem.Model.deleteModels((checkitem) => checkitem.card_uid === cardUID);
    ProjectCard.Model.deleteModel(cardUID);
    MetadataModel.Model.deleteModels((model) => model.uid === cardUID);

    ProjectCard.Model.getModels((model) => model.column_uid === card.column_uid).forEach((model) => {
        if (model.order > card.order) {
            model.order -= 1;
        }
    });

    ProjectCardBotScope.Model.deleteModels((scope) => scope.card_uid === cardUID);
    ProjectCardBotSchedule.Model.deleteModels((schedule) => schedule.card_uid === cardUID);

    if (shouldUnsubscribe) {
        socket.unsubscribe(ESocketTopic.BoardCard, [cardUID]);
    }

    return;
};

export const deleteProjectColumnModel = (columnUID: string, archiveData?: { uid: string; name: string; archivedAt: Date; sourceCount?: number }) => {
    const column = ProjectColumn.Model.getModel(columnUID);
    if (!column) {
        return;
    }

    ProjectColumnBotScope.Model.deleteModels((scope) => scope.project_column_uid === columnUID);
    ProjectColumnBotSchedule.Model.deleteModels((schedule) => schedule.project_column_uid === columnUID);
    ProjectColumn.Model.deleteModel(columnUID);

    if (!archiveData) {
        return;
    }

    const archiveColumn = ProjectColumn.Model.getModel((model) => model.project_uid === column.project_uid && model.is_archive);
    if (archiveColumn) {
        archiveColumn.count += archiveData.sourceCount ?? column.count;
    }

    const restColumns = ProjectColumn.Model.getModels((model) => model.project_uid === column.project_uid && model.order > column.order);
    for (let i = 0; i < restColumns.length; ++i) {
        const restColumn = restColumns[i];
        if (restColumn.order > column.order) {
            restColumn.order -= 1;
        }
    }

    const cards = ProjectCard.Model.getModels((model) => model.column_uid === column.uid || model.column_uid === archiveData.uid);
    let archivedCardsCount = 0;
    for (let i = 0; i < cards.length; ++i) {
        const card = cards[i];
        if (card.column_uid === archiveData.uid) {
            card.order += archiveData.sourceCount ?? column.count;
            continue;
        }

        card.column_uid = archiveData.uid;
        card.column_name = archiveData.name;
        card.archived_at = archiveData.archivedAt;
        card.order = archivedCardsCount;
        archivedCardsCount += 1;
    }
};
