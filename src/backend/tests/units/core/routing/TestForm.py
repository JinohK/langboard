from inspect import Parameter, Signature
from fastapi.params import Depends, Form
from langboard.core.routing import BaseFormModel, form_model, get_form_scope
from pytest import mark, raises


@form_model
class FakeForm(BaseFormModel):
    fake: str
    fake_default: int = 0


class TestForm:
    def test_throw_exception_when_form_model_is_not_decorated_with_form_model(self):
        with raises(NotImplementedError) as e:

            class WrongForm(BaseFormModel):
                pass

            wrong_form = WrongForm()
            wrong_form.from_form()

        assert e.value.args[0] == "Must decorate the model class with the `form_model` decorator."

    def test_initialization(self):
        form = FakeForm(fake="fake")
        signature = form.from_form.__signature__

        assert isinstance(signature, Signature)

        fake_param = signature.parameters["fake"]
        fake_default_param = signature.parameters["fake_default"]

        assert fake_param.annotation is str
        assert isinstance(fake_param.default, Form)
        assert fake_param.kind == Parameter.POSITIONAL_ONLY

        assert fake_default_param.annotation is int
        assert isinstance(fake_default_param.default, Form)
        assert fake_default_param.default.default == 0
        assert fake_default_param.kind == Parameter.POSITIONAL_ONLY

    @mark.parametrize(
        "data",
        [
            ({"fake": "fake1", "fake_default": 1}),
            ({"fake": "fake2", "fake_default": 2}),
            ({"fake": "fake3", "fake_default": 3}),
        ],
    )
    def test_from_form(self, data: dict):
        form = FakeForm.from_form(**data)

        for key, value in data.items():
            assert getattr(form, key) == value

    def test_get_form_scope(self):
        scope = get_form_scope(FakeForm)

        assert isinstance(scope, Depends)
        assert scope.dependency == FakeForm.from_form
        assert scope.use_cache
