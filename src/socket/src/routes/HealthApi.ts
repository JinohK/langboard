import { JsonResponse } from "@/core/server/ApiResponse";
import Routes from "@/core/server/Routes";
import { EHttpStatus } from "@langboard/core/enums";

Routes.get("/health", async () => {
    return JsonResponse({}, EHttpStatus.HTTP_204_NO_CONTENT);
});
