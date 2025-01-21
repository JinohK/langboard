from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SnowflakeID, SqlBuilder
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...models import Card, CardRelationship, GlobalCardRelationshipType, Project
from ...tasks import CardRelationshipActivityTask
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
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []

        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardRelationship, GlobalCardRelationshipType)
                .join(
                    GlobalCardRelationshipType,
                    CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
                )
                .join(
                    Card,
                    (CardRelationship.column("card_id_parent") == Card.column("id"))
                    | (CardRelationship.column("card_id_child") == Card.column("id")),
                )
                .where(
                    (
                        (CardRelationship.column("card_id_parent") == card.id)
                        | (CardRelationship.column("card_id_child") == card.id)
                    )
                    & (Card.column("id") != card.id)
                )
            )
        raw_relationships = result.all()
        if not as_api:
            return list(raw_relationships)

        relationships = []
        for relationship, relationship_type in raw_relationships:
            relationships.append(
                {
                    "uid": relationship.get_uid(),
                    "relationship_type_uid": relationship_type.get_uid(),
                    "parent_card_uid": relationship.card_id_parent.to_short_code(),
                    "child_card_uid": relationship.card_id_child.to_short_code(),
                }
            )
        return relationships

    async def get_by_card_with_type(
        self, project: TProjectParam, card: TCardParam, is_parent: bool
    ) -> list[tuple[CardRelationship, GlobalCardRelationshipType, Card]]:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return []
        project, card = params

        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardRelationship, GlobalCardRelationshipType, Card)
                .join(
                    GlobalCardRelationshipType,
                    CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
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

        async with DbSession.use_db() as db:
            await db.exec(
                SqlBuilder.delete.table(CardRelationship).where(
                    CardRelationship.column("card_id_child" if is_parent else "card_id_parent") == card.id
                )
            )
            await db.commit()

        async with DbSession.use_db() as db:
            new_relationships_dict: dict[SnowflakeID, bool] = {}
            for related_card_uid, relationship_type_uid in relationships:
                related_card = await self._get_by_param(Card, related_card_uid)
                if (
                    not related_card
                    or related_card.project_id != project.id
                    or related_card.id in new_relationships_dict
                    or related_card.id in opposite_relationship_ids
                ):
                    continue

                relationship_type = await self._get_by_param(GlobalCardRelationshipType, relationship_type_uid)
                if not relationship_type:
                    continue

                new_relationship = CardRelationship(
                    relation_type_id=relationship_type.id,
                    card_id_parent=related_card.id if is_parent else card.id,
                    card_id_child=card.id if is_parent else related_card.id,
                )
                db.insert(new_relationship)
                api_relationship = relationship_type.api_response()
                api_relationship.pop("uid")
                new_relationships_dict[related_card.id] = True
            await db.commit()

        new_relationships = await self.get_all_by_card(card, as_api=True)

        model = {
            "card_uid": card.get_uid(),
            "relationships": new_relationships,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:relationships:updated:{project.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

        CardRelationshipActivityTask.card_relationship_updated(
            user_or_bot, project, card, list(original_relationship_ids), list(new_relationships_dict.keys()), is_parent
        )

        return True

    async def __get_records_by_params(self, project: TProjectParam, card: TCardParam):
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        return project, card
