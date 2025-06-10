import BotRunner from "@/core/ai/BotRunner";
import EInternalBotType from "@/core/ai/EInternalBotType";
import EApiErrorCode from "@/core/server/ApiErrorCode";
import { ApiErrorResponse, JsonResponse } from "@/core/server/ApiResponse";
import EHttpStatus from "@/core/server/EHttpStatus";
import Routes from "@/core/server/Routes";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import formidable from "formidable";

Routes.post("/board/{projectUID}/chat/upload", async ({ req, user, params }) => {
    const { projectUID } = params;
    if (!projectUID) {
        return ApiErrorResponse(EApiErrorCode.NF2001, EHttpStatus.HTTP_404_NOT_FOUND);
    }

    if (!(await ProjectAssignedUser.isAssigned(user.id, projectUID))) {
        return ApiErrorResponse(EApiErrorCode.PE1001, EHttpStatus.HTTP_403_FORBIDDEN);
    }

    const form = new formidable.IncomingForm({
        keepExtensions: true,
        multiples: false,
    });

    try {
        const [_, files] = await form.parse(req);
        const file = files.file?.[0];
        if (!file) {
            return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
        }

        const filePath = await BotRunner.uploadFile(EInternalBotType.ProjectChat, file);
        if (!filePath) {
            return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
        }

        return JsonResponse({ file_path: filePath }, EHttpStatus.HTTP_201_CREATED);
    } catch {
        return ApiErrorResponse(EApiErrorCode.OP1002, EHttpStatus.HTTP_406_NOT_ACCEPTABLE);
    }
});
