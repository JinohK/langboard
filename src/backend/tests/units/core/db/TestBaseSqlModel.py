from datetime import datetime
from langboard.core.db import BaseSqlModel, SecretStrType
from pydantic import SecretStr
from pytest import raises
from sqlmodel import Field


class TestDbModel(BaseSqlModel):
    __test__ = False
    test1: str
    test2: str
    test3: str

    def _get_repr_keys(self) -> list[str]:
        return ["id", "test1", "test2", "test3"]


class TestSerializeModel(BaseSqlModel):
    __test__ = False
    test1: datetime
    test2: SecretStr = Field(nullable=False, sa_type=SecretStrType())

    def _get_repr_keys(self) -> list[str]:
        return ["id", "test1", "test2"]


class TestBaseSqlModel:
    def test_throw_exception_when_not_override_get_repr_keys(self):
        with raises(TypeError) as e:

            class Test(BaseSqlModel):
                pass

            Test()

        assert (
            e.value.args[0]
            == "Can't instantiate abstract class Test without an implementation for abstract method '_get_repr_keys'"
        )

    def test_is_new(self):
        test = TestDbModel(test1="test1", test2="test2", test3="test3")

        assert not TestDbModel.is_new(self)

        assert test.is_new()

        test.id = 1

        assert not test.is_new()

    def test_str(self):
        test = TestDbModel(test1="test1", test2="test2", test3="test3")

        assert str(test) == "TestDbModel(test1=test1, test2=test2, test3=test3)"

        test.id = 1

        assert str(test) == "TestDbModel(id=1, test1=test1, test2=test2, test3=test3)"

    def test_repr(self):
        test = TestDbModel(test1="test1", test2="test2", test3="test3")

        assert repr(test) == str(test)

        test.id = 1

        assert repr(test) == str(test)

    def test_eq(self):
        model1 = TestDbModel(test1="test1", test2="test2", test3="test3")
        model2 = TestDbModel(test1="test1", test2="test2", test3="test3")

        assert model1 != model2

        model1.id = 1

        assert model1 != model2

        model2.id = 1

        assert model1 == model2

    def test_serialize(self):
        model = TestSerializeModel(test1=datetime.now(), test2="secret")

        serialized = model.model_dump()

        assert serialized["test1"] == model.test1.isoformat()
        assert serialized["test2"] == model.test2.get_secret_value()
