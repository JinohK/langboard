import AppSetting from "@/models/AppSetting";
import Bot from "@/models/Bot";
import Card from "@/models/Card";
import ChatHistory from "@/models/ChatHistory";
import ProjectAssignedBot from "@/models/ProjectAssignedBot";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import ProjectRole from "@/models/ProjectRole";
import ProjectWiki from "@/models/ProjectWiki";
import ProjectWikiAssignedUser from "@/models/ProjectWikiAssignedUser";
import User from "@/models/User";
import UserNotification from "@/models/UserNotification";
import UserNotificationUnsubscription from "@/models/UserNotificationUnsubscription";

export const ALL_ENTITIES = [
    AppSetting,
    Bot,
    Card,
    ChatHistory,
    ProjectAssignedUser,
    ProjectAssignedBot,
    ProjectRole,
    ProjectWiki,
    ProjectWikiAssignedUser,
    User,
    UserNotification,
    UserNotificationUnsubscription,
];
