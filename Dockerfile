FROM python:3.12

WORKDIR /app

ENV PIP_DISABLE_PIP_VERSION_CHECK=on
ENV POETRY_HOME="/opt/poetry"
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_CREATE=false
ENV VIRTUAL_ENV="/opt/venv"
ENV PATH="$POETRY_HOME/bin:$VIRTUAL_ENV/bin:$PATH"

RUN python -m venv $VIRTUAL_ENV

RUN apt-get update && apt-get install -y
RUN apt install libuv1-dev libssl-dev -y

RUN curl -sSL https://install.python-poetry.org | python3 - --git https://github.com/python-poetry/poetry.git@master
RUN poetry --version

COPY ./src/backend ./src/backend
COPY pyproject.toml poetry.lock README.md ./

RUN poetry install
