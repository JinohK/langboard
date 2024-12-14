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
        CHANGE_COLUMN_NAME: "/board/{uid}/column/{column_uid}/name",
        CHANGE_COLUMN_ORDER: "/board/{uid}/column/{column_uid}/order",
        CARD: {
            CHANGE_ORDER: "/board/{uid}/card/{card_uid}/order",
            GET_DETAILS: "/board/{uid}/card/{card_uid}",
            CHANGE_DETAILS: "/board/{uid}/card/{card_uid}/details",
            UPDATE_ASSIGNED_USERS: "/board/{uid}/card/{card_uid}/assigned-users",
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

export const SOCKET_SERVER_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "board:chat:available",
        CHAT_SENT: "board:chat:sent",
        CHAT_STREAM: "board:chat:stream",
        COLUMN_NAME_CHANGED: "column:name:changed:{uid}",
        COLUMN_ORDER_CHANGED: "column:order:changed:{uid}",
        CARD: {
            CREATED: "board:card:created:{uid}",
            ORDER_CHANGED: "board:card:order:changed:{uid}",
            TITLE_CHANGED: "board:card:title:changed:{uid}",
            DEADLINE_CHANGED: "board:card:deadline:changed:{uid}",
            DESCRIPTION_CHANGED: "board:card:description:changed:{uid}",
            ASSIGNED_USERS_CHANGED: "board:card:assigned_users:changed:{uid}",
            EDITOR_USERS: "board:card:editor:users:{uid}",
            EDITOR_START_EDITING: "board:card:editor:start:{uid}",
            EDITOR_STOP_EDITING: "board:card:editor:stop:{uid}",
            ATTACHMENT: {
                UPLOADED: "board:card:attachment:uploaded:{uid}",
                NAME_CHANGED: "board:card:attachment:name:changed:{uid}",
                ORDER_CHANGED: "board:card:attachment:order:changed:{uid}",
                DELETED: "board:card:attachment:deleted:{uid}",
            },
            COMMENT: {
                ADDED: "board:card:comment:added:{uid}",
                UPDATED: "board:card:comment:updated:{uid}",
                DELETED: "board:card:comment:deleted:{uid}",
                REACTED: "board:card:comment:reacted:{uid}",
            },
            CHECKITEM: {
                CREATED: "board:card:checkitem:created:{uid}",
                TITLE_CHANGED: "board:card:checkitem:title:changed:{uid}",
                ORDER_CHANGED: "board:card:checkitem:order:changed:{uid}",
                CARDIFIED: "board:card:checkitem:cardified:{uid}",
                DELETED: "board:card:checkitem:deleted:{uid}",
                TIMER_STARTED: "board:card:checkitem:timer:started:{uid}",
                TIMER_STOPPED: "board:card:checkitem:timer:stopped:{uid}",
            },
            SUB_CHECKITEM: {
                CREATED: "board:card:sub-checkitem:created:{uid}",
                ORDER_CHANGED: "board:card:sub-checkitem:order:changed:{uid}",
            },
        },
    },
} as const;

export const SOCKET_CLIENT_EVENTS = {
    BOARD: {
        IS_CHAT_AVAILABLE: "board:chat:available",
        CHAT_SEND: "board:chat:send",
        CARD: {
            EDITOR_USERS: "board:card:editor:users",
            EDITOR_START_EDITING: "board:card:editor:start",
            EDITOR_STOP_EDITING: "board:card:editor:stop",
        },
    },
} as const;
