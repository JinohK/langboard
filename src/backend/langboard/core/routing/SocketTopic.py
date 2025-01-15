from enum import Enum


GLOBAL_TOPIC_ID = "all"
NONE_TOPIC_ID = "none"


class SocketTopic(Enum):
    Dashboard = "dashboard"
    Board = "board"
    BoardCard = "board_card"
    BoardWiki = "board_wiki"
    BoardWikiPrivate = "board_wiki_private"
    User = "user"
    UserPrivate = "user_private"
    Global = "global"
    NoneTopic = "none"
