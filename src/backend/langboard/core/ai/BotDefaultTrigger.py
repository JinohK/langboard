from enum import Enum


class BotDefaultTrigger(Enum):
    BotCreated = "bot_created"
    BotProjectAssigned = "bot_project_assigned"
    BotMentioned = "bot_mentioned"
    BotCronScheduled = "bot_cron_scheduled"
