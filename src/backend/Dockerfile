FROM pypy:3

WORKDIR /app

RUN apt-get update && apt-get install -y
RUN apt install libuv1-dev libssl-dev -y

COPY . .

RUN pypy3 -m pip install --upgrade pip

RUN pypy3 -m pip install -r requirements.txt
