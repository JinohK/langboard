import BotRunner from "@/core/ai/BotRunner";
import { ApiErrorResponse, JsonResponse } from "@/core/server/ApiResponse";
import Routes from "@/core/server/Routes";
import Logger from "@/core/utils/Logger";
import { EInternalBotType } from "@/models/InternalBot";
import ProjectAssignedInternalBot from "@/models/ProjectAssignedInternalBot";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import { EApiErrorCode, EHttpStatus } from "@langboard/core/enums";
import { IncomingForm } from "formidable";

Routes.post("/board/{projectUID}/chat/upload", async ({ req, user, params }) => {
    const { projectUID } = params;
    if (!projectUID) {
        return ApiErrorResponse(EApiErrorCode.NF2001, EHttpStatus.HTTP_404_NOT_FOUND);
    }

    if (!(await ProjectAssignedUser.isAssigned(user.id, projectUID))) {
        return ApiErrorResponse(EApiErrorCode.PE1001, EHttpStatus.HTTP_403_FORBIDDEN);
    }

    const internalBot = await ProjectAssignedInternalBot.getInternalBotByProjectUID(EInternalBotType.ProjectChat, projectUID);
    if (!internalBot) {
        return ApiErrorResponse(EApiErrorCode.NF3004, EHttpStatus.HTTP_404_NOT_FOUND);
    }

    const form = new IncomingForm({
        keepExtensions: true,
        multiples: false,
    });

    try {
        const [_, files] = await form.parse(req);
        const file = files.attachment?.[0];
        if (!file) {
            return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
        }

        const filePath = await BotRunner.uploadFile(internalBot, file);
        if (!filePath) {
            return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
        }

        return JsonResponse({ file_path: filePath }, EHttpStatus.HTTP_201_CREATED);
    } catch (error) {
        Logger.error(error);
        return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
    }
});
