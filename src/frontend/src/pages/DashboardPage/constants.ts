import { IGetProjectsResponse } from "@/controllers/api/dashboard/useGetProjects";

export const PROJECT_TABS: (keyof IGetProjectsResponse)[] = ["all", "starred", "recent", "unstarred"];
