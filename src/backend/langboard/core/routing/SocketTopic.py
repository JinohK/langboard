from enum import Enum


class SocketTopic(Enum):
    Board = "board"
    BoardWiki = "board_wiki"
    BoardWikiPrivate = "board_wiki_private"
    NoneTopic = "none"
