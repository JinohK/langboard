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
        CARD: "/activity/project/{uid}/card/{card_uid}",
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
            CHANGE_DETAILS: "/board/{uid}/card/{card_uid}/details",
            ATTACHMENT: {
                UPLOAD: "/board/{uid}/card/{card_uid}/attachment",
                CHANGE_NAME: "/board/{uid}/card/{card_uid}/attachment/{attachment_uid}/name",
                CHANGE_ORDER: "/board/{uid}/card/{card_uid}/attachment/{attachment_uid}/order",
                DELETE: "/board/{uid}/card/{card_uid}/attachment/{attachment_uid}",
            },
            COMMENT: {
                GET_LIST: "/board/{uid}/card/{card_uid}/comments",
                ADD: "/board/{uid}/card/{card_uid}/comment",
                UPDATE: "/board/{uid}/card/{card_uid}/comment/{comment_uid}",
                DELETE: "/board/{uid}/card/{card_uid}/comment/{comment_uid}",
                REACT: "/board/{uid}/card/{card_uid}/comment/{comment_uid}/react",
            },
            CHECKITEM: {
                CREATE: "/board/{uid}/card/{card_uid}/checkitem",
                CHANGE_TITLE: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}/title",
                CHANGE_ORDER: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}/order",
                CARDIFY: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify",
                DELETE: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}",
                TOGGLE_TIMER: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}/timer/toggle",
            },
            SUB_CHECKITEM: {
                CREATE: "/board/{uid}/card/{card_uid}/checkitem/{checkitem_uid}/sub-checkitem",
                CHANGE_ORDER: "/board/{uid}/card/{card_uid}/sub-checkitem/{sub_checkitem_uid}/order",
            },
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
        COLUMN_ORDER_CHANGED: "column:order:changed:{uid}",
        CARD: {
            CREATED: "card:created:{uid}",
            ORDER_CHANGED: "card:order:changed:{uid}",
            TITLE_CHANGED: "card:title:changed:{uid}",
            DEADLINE_CHANGED: "card:deadline:changed:{uid}",
            DESCRIPTION_CHANGED: "card:description:changed:{uid}",
            EDITOR_USERS: "card:editor:users:{uid}",
            EDITOR_START_EDITING: "card:editor:start:{uid}",
            EDITOR_STOP_EDITING: "card:editor:stop:{uid}",
            ATTACHMENT: {
                UPLOADED: "card:attachment:uploaded:{uid}",
                NAME_CHANGED: "card:attachment:name:changed:{uid}",
                ORDER_CHANGED: "card:attachment:order:changed:{uid}",
                DELETED: "card:attachment:deleted:{uid}",
            },
            COMMENT: {
                ADDED: "card:comment:added:{uid}",
                UPDATED: "card:comment:updated:{uid}",
                DELETED: "card:comment:deleted:{uid}",
                REACTED: "card:comment:reacted:{uid}",
            },
            CHECKITEM: {
                CREATED: "card:checkitem:created:{uid}",
                TITLE_CHANGED: "card:checkitem:title:changed:{uid}",
                ORDER_CHANGED: "card:checkitem:order:changed:{uid}",
                CARDIFIED: "card:checkitem:cardified:{uid}",
                DELETED: "card:checkitem:deleted:{uid}",
                TIMER_STARTED: "card:checkitem:timer:started:{uid}",
                TIMER_STOPPED: "card:checkitem:timer:stopped:{uid}",
            },
            SUB_CHECKITEM: {
                CREATED: "card:sub-checkitem:created:{uid}",
                ORDER_CHANGED: "card:sub-checkitem:order:changed:{uid}",
            },
        },
    },
} as const;

export const SOCKET_CLIENT_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "chat:available",
        CHAT_SEND: "chat:send",
        COLUMN_ORDER_CHANGED: "column:order:changed",
        CARD: {
            CREATED: "card:created",
            ORDER_CHANGED: "card:order:changed",
            DETAILS_CHANGED: "card:details:changed",
            EDITOR_USERS: "card:editor:users",
            EDITOR_START_EDITING: "card:editor:start",
            EDITOR_STOP_EDITING: "card:editor:stop",
            ATTACHMENT: {
                UPLOADED: "card:attachment:uploaded",
                NAME_CHANGED: "card:attachment:name:changed",
                ORDER_CHANGED: "card:attachment:order:changed",
                DELETED: "card:attachment:deleted",
            },
            COMMENT: {
                ADDED: "card:comment:added",
                UPDATED: "card:comment:updated",
                DELETED: "card:comment:deleted",
                REACTED: "card:comment:reacted",
            },
            CHECKITEM: {
                CREATED: "card:checkitem:created",
                TITLE_CHANGED: "card:checkitem:title:changed",
                ORDER_CHANGED: "card:checkitem:order:changed",
                CARDIFIED: "card:checkitem:cardified",
                DELETED: "card:checkitem:deleted",
                TIMER_STARTED: "card:checkitem:timer:started",
                TIMER_STOPPED: "card:checkitem:timer:stopped",
            },
            SUB_CHECKITEM: {
                CREATED: "card:sub-checkitem:created",
                ORDER_CHANGED: "card:sub-checkitem:order:changed",
            },
        },
    },
} as const;
