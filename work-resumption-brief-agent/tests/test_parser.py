from pathlib import Path

from src.components.input_parser.parser import parse_input


def test_parse_input(tmp_path: Path):
    input_file = tmp_path / "sample.md"
    input_file.write_text("# Work Resume\n\nContinue the project.", encoding="utf-8")

    result = parse_input(str(input_file))

    assert result["source"] == str(input_file)
    assert result["content"] == "# Work Resume\n\nContinue the project."
    assert result["length"] == len(result["content"])


def test_parse_input_missing_file(tmp_path: Path):
    missing_file = tmp_path / "missing.md"

    try:
        parse_input(str(missing_file))
        assert False
    except FileNotFoundError:
        assert True