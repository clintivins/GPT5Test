from gpt5test_python import greet


def test_greet():
    assert greet("Alice") == "Hello, Alice!"
