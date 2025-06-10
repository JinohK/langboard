import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import ProjectRole, { EProjectRoleAction } from "@/models/ProjectRole";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    if (context.client.user.is_admin) {
        return true;
    }

    if (!(await ProjectAssignedUser.isAssigned(context.client.user.id, context.topicId))) {
        return false;
    }

    if (!(await ProjectRole.isGranted(context.client.user.id, context.topicId, EProjectRoleAction.Update))) {
        return false;
    }

    return true;
});
