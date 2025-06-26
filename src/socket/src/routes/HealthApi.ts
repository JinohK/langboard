import { JsonResponse } from "@/core/server/ApiResponse";
import EHttpStatus from "@/core/server/EHttpStatus";
import Routes from "@/core/server/Routes";

Routes.get("/health", async () => {
    return JsonResponse({}, EHttpStatus.HTTP_204_NO_CONTENT);
});
