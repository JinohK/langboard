from langboard.core.utils.String import concat


class TestString:
    def test_concat(self):
        test_strs = ["Any", "data", "to", "concatenate"]
        result = concat(*test_strs)

        assert result == "".join(test_strs)
