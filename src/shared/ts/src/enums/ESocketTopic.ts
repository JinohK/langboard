export enum ESocketTopic {
    Dashboard = "dashboard",
    Board = "board",
    BoardCard = "board_card",
    BoardWiki = "board_wiki",
    BoardWikiPrivate = "board_wiki_private",
    BoardSettings = "board_settings",
    User = "user",
    UserPrivate = "user_private",
    AppSettings = "app_settings",
    OllamaManager = "ollama_manager",
    Global = "global",
    None = "none",
}

export const GLOBAL_TOPIC_ID = "all" as const;
export const NONE_TOPIC_ID = "none" as const;
