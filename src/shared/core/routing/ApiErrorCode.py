from enum import Enum


class ApiErrorCode(Enum):
    # Authentication and Authorization Errors
    AU1001 = "No authorized to access this endpoint."
    AU1002 = "The email isn't verified yet."
    AU1003 = "The account isn't activated yet."
    AU1004 = "Session is invalid or has expired."

    # Exists / Conflict
    EX1001 = "The email is already verified."
    EX1002 = "The email is already primary."
    EX1003 = "The email is already in use."
    EX1004 = "The account is already activated."
    EX3001 = "Bot uname already exists."
    EX3002 = "Default internal bot cannot be deleted."

    # Permission Errors
    PE1001 = "Not enough permissions to access this endpoint."
    PE1002 = "Primary email cannot be deleted."
    PE2001 = "Bot is not assigned to the project."
    PE2002 = "No permission to access this project."
    PE2003 = "No permission to access this attachment."
    PE2004 = "No permission to access this checkitem."
    PE2005 = "No permission to access this comment."
    PE2006 = "No permission to access this wiki."

    # Not Found Errors
    NF1001 = "Subemail not found or subemail's user and current user don't match."
    NF1002 = "Subemail not found."
    NF1003 = "User group not found."
    NF1004 = "User not found."
    NF2001 = "Project not found."
    NF2002 = "Assignee not found."
    NF2003 = "Invitation not found."
    NF2004 = "Project or card not found."
    NF2005 = "Project or column not found."
    NF2006 = "Project or assignee not found."
    NF2007 = "Project or bot not found."
    NF2008 = "Project or user not found."
    NF2009 = "Project or label not found."
    NF2010 = "Project or wiki not found."
    NF2011 = "Project, card, or attachment not found."
    NF2012 = "Project, card, or checklist not found."
    NF2013 = "Project, card, or checkitem not found."
    NF2014 = "Project, card, or comment not found."
    NF2015 = "Project, column, or bot not found."
    NF2016 = "Project, card, or bot not found."
    NF2017 = "Project, bot, or schedule not found."
    NF2018 = "Project, card, or metadata not found."
    NF2019 = "Project, wiki, or metadata not found."
    NF2020 = "Project or chat template not found."
    NF2021 = "Project or internal bot not found."
    NF3001 = "Bot not found."
    NF3002 = "Settings not found."
    NF3003 = "Global relationships not found."
    NF3004 = "Internal bot not found."

    # Validation Errors
    VA0000 = "Invalid request."
    VA1001 = "Couldn't find account."
    VA1002 = "Incorrect password."
    VA1003 = "Language code is invalid."
    VA3001 = "Invalid crontab format."
    VA3002 = "Invalid running time with required fields."
    VA3003 = "Invalid target table or UID."
    VA3004 = "Invalid request form."

    # Operation Failure
    OP0000 = "Internal server error."
    OP1001 = "Failed to send email."
    OP1002 = "Failed to upload."

    def to_dict(self):
        return {"code": self.name, "message": self.value}
