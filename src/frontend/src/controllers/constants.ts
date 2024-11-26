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
        GET_SUBEMAILS: "/account/subemails",
        UPDATE_PROFILE: "/account/profile",
        CHANGE_PASSWORD: "/account/password",
        EMAIL: {
            CRUD: "/account/email",
            VERIFY: "/account/email/verify",
        },
    },
    ACTIVITIY: {
        USER: "/activity/user",
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
        GET_CARDS: "/board/{uid}/cards",
        GET_COLUMN_CARDS: "/board/{uid}/column/{column_uid}/cards",
        CHANGE_COLUMN_ORDER: "/board/{uid}/column/{column_uid}/order",
        CARD: {
            CHANGE_ORDER: "/board/{uid}/card/{card_uid}/order",
            GET_DETAILS: "/board/{uid}/card/{card_uid}",
            GET_COMMENTS: "/board/{uid}/card/{card_uid}/comments",
            UPLOAD_ATTACHMENT: "/board/{uid}/card/{card_uid}/attachment",
        },
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
        CARD: {
            ORDER_CHANGED: "card:order:changed:{column_uid}",
            EDITOR_USERS: "card:editor:users:{uid}",
            EDITOR_START_EDITING: "card:editor:start:{uid}",
            EDITOR_STOP_EDITING: "card:editor:stop:{uid}",
        },
    },
} as const;

export const SOCKET_CLIENT_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "chat:available",
        CHAT_SEND: "chat:send",
        CARD: {
            ORDER_CHANGED: "card:order:changed",
            BASE_EDITOR: "card:editor",
            EDITOR_USERS: "card:editor:users",
            EDITOR_START_EDITING: "card:editor:start",
            EDITOR_STOP_EDITING: "card:editor:stop",
        },
    },
} as const;
