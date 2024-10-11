from datetime import datetime
from langboard.core.utils.String import capitalize_all_words, concat, get_random_filename


class TestString:
    def test_concat(self):
        test_strs = ["Any", "data", "to", "concatenate"]
        result = concat(*test_strs)

        assert result == "".join(test_strs)

    def test_capitalize_all_words(self):
        test_str = "capitalize all words"
        result = capitalize_all_words(test_str)

        assert result == "Capitalize All Words"

    def test_get_random_filename(self):
        file_name = "file.txt"
        result = get_random_filename(file_name)

        timestamp = result[:10]
        _ = result[10:-4]
        extension = result[-4:]

        assert datetime.fromtimestamp(int(timestamp)) <= datetime.now()
        assert extension == ".txt"
