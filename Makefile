.PHONY: help init format lint start_docker_dev stop_docker_dev start_docker_prod stop_docker_prod

check_tools:
	@command -v poetry >/dev/null 2>&1 || { echo >&2 "$(RED)Poetry is not installed. Aborting.$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "$(RED)NPM is not installed. Aborting.$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo >&2 "$(RED)Docker is not installed. Aborting.$(NC)"; exit 1; }
	@command -v pipx >/dev/null 2>&1 || { echo >&2 "$(RED)pipx is not installed. Aborting.$(NC)"; exit 1; }
	@echo "$(GREEN)All required tools are installed.$(NC)"

help: ## show this help message
	@echo '----'
	@grep -hE '^\S+:.*##' $(MAKEFILE_LIST) | \
	awk -F ':.*##' '{printf "\033[36mmake %s\033[0m: %s\n", $$1, $$2}' | \
	column -c2 -t -s :
	@echo '----'

clean_python_cache: ## clean Python cache
	@echo "Cleaning Python cache..."
	find . -type d -name '__pycache__' -exec rm -r {} +
	find . -type f -name '*.py[cod]' -exec rm -f {} +
	find . -type f -name '*~' -exec rm -f {} +
	find . -type f -name '.*~' -exec rm -f {} +
	@echo "$(GREEN)Python cache cleaned.$(NC)"

clean_yarn_cache: ## clean Yarn cache
	@echo "Cleaning yarn cache..."
	cd src/frontend && yarn cache clean --force
	rm -rf src/frontend/node_modules src/frontend/build
	@echo "$(GREEN)Yarn cache and frontend directories cleaned.$(NC)"

format: ## run code formatters
	poetry run ruff check . --fix
	poetry run ruff format .
	cd src/frontend && yarn run format

lint: ## run linters
	poetry run ruff check .
	cd src/frontend && yarn run lint

install_backend: ## install the backend dependencies
	@echo 'Installing backend dependencies'
	@poetry install

install_frontend: ## install frontend dependencies
	@echo 'Installing frontend dependencies'
	cd src/frontend && yarn install

build_frontend: ## build the frontend static files
	cd src/frontend && CI='' yarn run build

init: check_tools clean_python_cache clean_yarn_cache ## initialize the project
	make install_backend
	make install_frontend
	make build_frontend
	@echo "$(GREEN)All requirements are installed.$(NC)"

start_docker_dev: ## run the development environment in Docker
	sudo chown -R 1001:root ./docker/volumes/db
	[ ! -f ./docker/volumes ] && mkdir ./docker/volumes
	[ ! -f ./docker/volumes/crontab ] && touch ./docker/volumes/crontab
	docker compose -f ./docker/docker-compose.dev.yaml --env-file ./.env up -d --build

stop_docker_dev: ## stop the development environment in Docker
	docker compose -f ./docker/docker-compose.dev.yaml --env-file ./.env down --rmi all --volumes

start_docker_prod: ## run the production environment in Docker
	sudo chown -R 1001:root ./docker/volumes/db
	[ ! -f ./docker/volumes ] && mkdir ./docker/volumes
	[ ! -f ./docker/volumes/crontab ] && touch ./docker/volumes/crontab
	docker compose -f ./docker/docker-compose.prod.yaml --env-file ./.env up -d --build

stop_docker_prod: ## stop the production environment in Docker
	docker compose -f ./docker/docker-compose.prod.yaml --env-file ./.env down --rmi all --volumes

unit_tests: ## run unit tests
	poetry run pytest src/backend/tests/units

cov_unit_tests: ## run unit tests with coverage
	poetry run pytest -vv --cov=src/backend/langboard src/backend/tests/units --cov-report=html:./src/backend/coverage
	@echo "$(GREEN)Coverage report generated in src/backend/coverage directory.$(NC)"