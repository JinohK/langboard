import ESocketTopic from "@/core/helpers/ESocketTopic";
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
    BotSchedule,
} from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";

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
    BotSchedule.Model.deleteModels((model) => model.filterable_table === "project" && model.filterable_uid === projectUID);
    ProjectColumn.Model.deleteModels((model) => model.project_uid === projectUID);
    ProjectLabel.Model.deleteModels((model) => model.project_uid === projectUID);
    ProjectCard.Model.deleteModels((model) => {
        if (model.project_uid !== projectUID) {
            return false;
        }

        if (socket.isSubscribed(ESocketTopic.BoardCard, model.uid)) {
            subscribedTopics[ESocketTopic.BoardCard].push(model.uid);
        }

        deleteCardModel(model.uid, false);
        return true;
    });
    const userGroupUIDs = currentUser.user_groups.map((group) => group.users.map((user) => user.uid)).flat();
    const memberUIDs = project.members
        .map((member) => member.uid)
        .concat(project.invited_members.map((member) => member.uid))
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

    BotSchedule.Model.deleteModels((model) => model.target_table === "card" && model.target_uid === cardUID);

    if (shouldUnsubscribe) {
        socket.unsubscribe(ESocketTopic.BoardCard, [cardUID]);
    }

    return;
};
