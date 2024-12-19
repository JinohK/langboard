from enum import Enum


class SocketTopic(Enum):
    Project = "project"
    Board = "board"
    BoardCard = "board_card"
    BoardWiki = "board_wiki"
    BoardWikiPrivate = "board_wiki_private"
    NoneTopic = "none"
