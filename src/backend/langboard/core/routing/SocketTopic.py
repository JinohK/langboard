from enum import Enum


class SocketTopic(Enum):
    Dashboard = "dashboard"
    Board = "board"
    BoardCard = "board_card"
    BoardWiki = "board_wiki"
    BoardWikiPrivate = "board_wiki_private"
    Global = "global"
    NoneTopic = "none"
