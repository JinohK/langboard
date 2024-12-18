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
        INVITATION: "/board/invitation",
        MAIN: (uid: string) => `/board/${uid}`,
        WIKI: (uid: string) => `/board/${uid}/wiki`,
        WIKI_PAGE: (uid: string, wikiUID: string) => `/board/${uid}/wiki/${wikiUID}`,
        SETTINGS: (uid: string) => `/board/${uid}/settings`,
        SETTINGS_PAGE: (uid: string, page: string) => `/board/${uid}/settings/${page}`,
        CARD: (uid: string, cardUID: string) => `/board/${uid}/${cardUID}`,
    },
    DASHBOARD: {
        ROUTE: "/dashboard",
        PAGE_TYPE: (type: string) => `/dashboard/${type}`,
        PROJECTS: {
            ROUTE: "/dashboard/projects",
            TAB: (tab: string) => `/dashboard/projects/${tab}`,
            ALL: "/dashboard/projects/all",
            STARRED: "/dashboard/projects/starred",
            RECENT: "/dashboard/projects/recent",
            UNSTARRED: "/dashboard/projects/unstarred",
        },
        CARDS: "/dashboard/cards",
        TRACKING: "/dashboard/tracking",
    },
    ERROR: (code: EHttpStatus | "*") => `/error/${code}`,
} as const;

export const REDIRECT_QUERY_NAME = "continue";
