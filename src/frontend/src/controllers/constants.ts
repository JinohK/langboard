export const API_ROUTES = {
    AUTH: {
        EMAIL: "/auth/email",
        SIGN_IN: "/auth/signin",
        REFRESH: "/auth/refresh",
        ABOUT_ME: "/auth/me",
        RECOVERY: {
            SEND_LINK: "/auth/recovery/send",
            VALIDATE: "/auth/recovery/validate",
            RESET: "/auth/recovery/reset",
        },
        SIGN_UP: {
            SEND_LINK: "/auth/signup",
            ACTIVATE: "/auth/signup/activate",
            EXISTS_EMAIL: "/auth/signup/exist/email",
            RESEND_LINK: "/auth/signup/resend",
        },
    },
    ACCOUNT: {
        UPDATE_PROFILE: "/account/profile",
        CHANGE_PASSWORD: "/account/password",
    },
    DASHBOARD: {
        ALL_STARRED_PROJECTS: "/dashboard/user/projects/starred",
        PROJECTS: "/dashboard/projects",
        TOGGLE_STAR_PROJECT: "/dashboard/projects/{uid}/star",
        CREATE_PROJECT: "/dashboard/projects/new",
    },
    BOARD: {
        IS_AVAILABLE: "/board/{uid}/available",
        CHAT_MESSAGES: "/board/{uid}/chat",
        CLEAR_CHAT_MESSAGES: "/board/{uid}/chat/clear",
    },
    REVERT: (path: string) => `/revert/${path}`,
} as const;

export const SOCKET_ROUTES = {
    BOARD: (uid: string) => `/board/${uid}`,
} as const;

export const SOCKET_SERVER_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "chat:available",
        CHAT_SENT: "chat:sent",
        CHAT_STREAM: "chat:stream",
    },
} as const;

export const SOCKET_CLIENT_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "chat:available",
        CHAT_SEND: "chat:send",
    },
} as const;
