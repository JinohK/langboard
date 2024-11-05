import EHttpStatus from "@/core/helpers/EHttpStatus";

export const ROUTES = {
    SIGN_IN: {
        EMAIL: "/auth/signin",
        PASSWORD: "/auth/signin/pwd",
    },
    SIGN_UP: {
        ROUTE: "/auth/signup",
        REQUIRED: "/auth/signup/required",
        ADDITIONAL: "/auth/signup/additional",
        OPTIONAL: "/auth/signup/optional",
        OVERVIEW: "/auth/signup/overview",
        COMPLETE: "/auth/signup/complete",
        ACTIVATE: "/auth/signup/activate",
    },
    ACCOUNT_RECOVERY: {
        NAME: "/auth/recovery",
        RESET: "/auth/recovery/reset",
    },
    AFTER_SIGN_IN: "/dashboard",
    ACCOUNT: {
        ROUTE: "/account",
        PROFILE: "/account/profile",
        EMAILS: {
            ROUTE: "/account/emails",
            VERIFY: "/account/emails/verify",
        },
        PASSWORD: "/account/password",
    },
    BOARD: {
        ROUTE: "/board",
        MAIN: (uid: string) => `/board/${uid}`,
    },
    DASHBOARD: {
        ROUTE: "/dashboard",
        PROJECTS: {
            ROUTE: "/dashboard/projects",
            ALL: "/dashboard/projects/all",
            STARRED: "/dashboard/projects/starred",
            RECENT: "/dashboard/projects/recent",
            UNSTARRED: "/dashboard/projects/unstarred",
        },
        TASKS: "/dashboard/tasks",
        TRACKING: "/dashboard/tracking",
    },
    ERROR: (code: EHttpStatus | "*") => `/error/${code}`,
} as const;

export const REDIRECT_QUERY_NAME = "continue";
