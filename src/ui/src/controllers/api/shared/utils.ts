import { TGetRefreshableListForm } from "@/controllers/api/shared/types";
import { API_ROUTES } from "@/controllers/constants";
import { ActivityModel, User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export const getRefreshableData = (form: TGetRefreshableListForm) => {
    let model;
    let url;
    switch (form.listType) {
        case "ActivityModel":
            model = ActivityModel.Model;
            switch (form.type) {
                case "user":
                    url = API_ROUTES.ACTIVITIY.USER;
                    break;
                case "project":
                    url = Utils.String.format(API_ROUTES.ACTIVITIY.PROJECT, { uid: form.project_uid });
                    break;
                case "card":
                    url = Utils.String.format(API_ROUTES.ACTIVITIY.CARD, { uid: form.project_uid, card_uid: form.card_uid });
                    break;
                case "project_wiki":
                    url = Utils.String.format(API_ROUTES.ACTIVITIY.PROJECT_WIKI, { uid: form.project_uid, wiki_uid: form.wiki_uid });
                    break;
                case "project_assignee":
                    url = Utils.String.format(API_ROUTES.ACTIVITIY.PROJECT_ASSIGNEE, { uid: form.project_uid, assignee_uid: form.assignee_uid });
                    break;
                default:
                    throw new Error("Invalid activity type");
            }
            break;
        case "User":
            model = User.Model;
            url = API_ROUTES.SETTINGS.USERS.GET_LIST;
            break;
        default:
            throw new Error("Invalid list type");
    }

    return [model, url] as const;
};
