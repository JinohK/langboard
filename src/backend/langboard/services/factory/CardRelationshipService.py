from typing import Any, Literal, Sequence, cast, overload
from ...core.db import DbSession, SnowflakeID, SqlBuilder
from ...core.service import BaseService, ServiceHelper
from ...models import Card, CardRelationship, GlobalCardRelationshipType, Project
from ...publishers import CardRelationshipPublisher
from ...tasks.activities import CardRelationshipActivityTask
from ...tasks.bot import CardBotTask
from .Types import TCardParam, TProjectParam, TUserOrBot


class CardRelationshipService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_relationship"

    @overload
    async def get_all_by_card(
        self, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType]]: ...
    @overload
    async def get_all_by_card(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_card(
        self, card: TCardParam, as_api: bool
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType]] | list[dict[str, Any]]:
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not card:
            return []

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardRelationship, GlobalCardRelationshipType)
                .join(
                    GlobalCardRelationshipType,
                    CardRelationship.column("relationship_type_id") == GlobalCardRelationshipType.column("id"),
                )
                .join(
                    Card,
                    (CardRelationship.column("card_id_parent") == Card.column("id"))
                    | (CardRelationship.column("card_id_child") == Card.column("id")),
                )
                .where(
                    (CardRelationship.column("card_id_parent") == card.id)
                    | (CardRelationship.column("card_id_child") == card.id)
                )
            )
        raw_relationships = result.all()
        if not as_api:
            return list(raw_relationships)

        relationships = [relationship.api_response() for relationship, _ in raw_relationships]
        return relationships

    @overload
    async def get_all_by_project(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType]]: ...
    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_project(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType]] | list[dict[str, Any]]:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        if not project:
            return []

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardRelationship, GlobalCardRelationshipType)
                .join(
                    GlobalCardRelationshipType,
                    CardRelationship.column("relationship_type_id") == GlobalCardRelationshipType.column("id"),
                )
                .join(
                    Card,
                    (CardRelationship.column("card_id_parent") == Card.column("id"))
                    | (CardRelationship.column("card_id_child") == Card.column("id")),
                )
                .join(Project, (Card.column("project_id") == Project.column("id")))
                .where(Project.column("id") == project.id)
            )
        raw_relationships = result.all()
        if not as_api:
            return list(raw_relationships)

        relationships = [relationship.api_response() for relationship, _ in raw_relationships]
        return relationships

    async def get_by_card_with_type(
        self, project: TProjectParam, card: TCardParam, is_parent: bool
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType, Card]]:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return []
        project, card = params

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardRelationship, GlobalCardRelationshipType, Card)
                .join(
                    GlobalCardRelationshipType,
                    CardRelationship.column("relationship_type_id") == GlobalCardRelationshipType.column("id"),
                )
                .join(
                    Card,
                    (CardRelationship.column("card_id_parent" if is_parent else "card_id_child") == Card.column("id")),
                )
                .where(
                    (CardRelationship.column("card_id_child" if is_parent else "card_id_parent") == card.id)
                    & (Card.column("id") != card.id)
                )
            )

        return list(result.all())

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        is_parent: bool,
        relationships: list[tuple[str, str]],
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        original_relationships = await self.get_by_card_with_type(project, card, is_parent)
        original_relationship_ids = [relationship.id for relationship, _, _ in original_relationships]

        opposite_relationship_ids = [
            related_card.id for _, _, related_card in await self.get_by_card_with_type(project, card, not is_parent)
        ]

        async with DbSession.use(readonly=False) as db:
            await db.exec(
                SqlBuilder.delete.table(CardRelationship).where(
                    CardRelationship.column("card_id_child" if is_parent else "card_id_parent") == card.id
                )
            )

        related_card_ids: set[SnowflakeID] = set()
        relationship_type_ids: set[SnowflakeID] = set()
        converted_relationships: list[tuple[SnowflakeID, SnowflakeID]] = []
        for related_card_uid, relationship_type_uid in relationships:
            related_card_id = SnowflakeID.from_short_code(related_card_uid)
            relationship_type_id = SnowflakeID.from_short_code(relationship_type_uid)
            related_card_ids.add(related_card_id)
            relationship_type_ids.add(relationship_type_id)
            converted_relationships.append((related_card_id, relationship_type_id))

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.column(Card.column("id"))
                .where(Card.column("project_id") == project.id)
                .where(Card.column("id").in_(related_card_ids))
            )
            related_card_ids = set(cast(Sequence[SnowflakeID], result.all()))

            result = await db.exec(
                SqlBuilder.select.table(GlobalCardRelationshipType).where(
                    GlobalCardRelationshipType.column("id").in_(relationship_type_ids)
                )
            )
            relationship_types = {relationship_type.id: relationship_type for relationship_type in result.all()}

        new_relationships_dict: dict[SnowflakeID, bool] = {}
        async with DbSession.use(readonly=False) as db:
            for related_card_id, relationship_type_id in converted_relationships:
                if (
                    related_card_id not in related_card_ids
                    or relationship_type_id not in relationship_types
                    or related_card_id in new_relationships_dict
                    or related_card_id in opposite_relationship_ids
                ):
                    continue

                new_relationship = CardRelationship(
                    relationship_type_id=relationship_type_id,
                    card_id_parent=related_card_id if is_parent else card.id,
                    card_id_child=card.id if is_parent else related_card_id,
                )
                await db.insert(new_relationship)
                api_relationship = relationship_types[relationship_type_id].api_response()
                api_relationship.pop("uid")
                new_relationships_dict[related_card_id] = True

        new_relationships = await self.get_all_by_card(card, as_api=True)

        CardRelationshipPublisher.updated(project, card, new_relationships)
        CardRelationshipActivityTask.card_relationship_updated(
            user_or_bot, project, card, list(original_relationship_ids), list(new_relationships_dict.keys()), is_parent
        )
        CardBotTask.card_relationship_updated(user_or_bot, project, card)

        return True

    async def __get_records_by_params(self, project: TProjectParam, card: TCardParam):
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        return project, card
