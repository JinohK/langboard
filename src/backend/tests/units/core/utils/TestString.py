from langboard.core.utils.String import capitalize_all_words, concat


class TestString:
    def test_concat(self):
        test_strs = ["Any", "data", "to", "concatenate"]
        result = concat(*test_strs)

        assert result == "".join(test_strs)

    def test_capitalize_all_words(self):
        test_str = "capitalize all words"
        result = capitalize_all_words(test_str)

        assert result == "Capitalize All Words"
