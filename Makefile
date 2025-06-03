.PHONY: help init format lint start_docker_dev stop_docker_dev start_docker_prod stop_docker_prod

COMPOSE_PREFIX := ./docker/docker-compose
COMPOSE_ARGS := -f $(COMPOSE_PREFIX).kafka.yaml -f $(COMPOSE_PREFIX).pg.yaml -f $(COMPOSE_PREFIX).redis.yaml -f $(COMPOSE_PREFIX).server.yaml --env-file ./.env
FRONTEND_DIR := src/frontend
BACKEND_DIR := src/backend
GREEN := \033[0;32m
RED := \033[0;31m
CYAN := \033[0;36m
DIM := \033[2m
BOLD := \033[1m
NC := \033[0m

check_tools:
	@command -v poetry >/dev/null 2>&1 || { echo >&2 "$(RED)Poetry is not installed. Aborting.$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "$(RED)NPM is not installed. Aborting.$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo >&2 "$(RED)Docker is not installed. Aborting.$(NC)"; exit 1; }
	@command -v pipx >/dev/null 2>&1 || { echo >&2 "$(RED)pipx is not installed. Aborting.$(NC)"; exit 1; }
	@printf "$(GREEN)All required tools are installed.$(NC)"

help: ## show this help message
	@echo ''
	@printf '$(BOLD)Available targets$(NC):\n'
	@echo '----------------------------------------------------------------------'
	@grep -hE '^\S+:.*##' $(MAKEFILE_LIST) | \
	awk -F ':.*##' '{printf "$(CYAN) %s$(NC): $(DIM)%s$(NC)\n", $$1, $$2}' | \
	column -c2 -t -s :
	@echo '----------------------------------------------------------------------'
	@echo ''
	@printf 'Command: $(CYAN)$(BOLD)make <target> [options]$(NC)\n'

clean_python_cache: ## clean Python cache
	@echo "Cleaning Python cache..."
	find . -type d -name '__pycache__' -exec rm -r {} +
	find . -type f -name '*.py[cod]' -exec rm -f {} +
	find . -type f -name '*~' -exec rm -f {} +
	find . -type f -name '.*~' -exec rm -f {} +
	@printf "$(GREEN)Python cache cleaned.$(NC)"

clean_yarn_cache: ## clean Yarn cache
	@echo "Cleaning yarn cache..."
	cd $(FRONTEND_DIR) && yarn cache clean --force
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/build
	@printf "$(GREEN)Yarn cache and frontend directories cleaned.$(NC)"

format: ## run code formatters
	poetry run ruff check . --fix
	poetry run ruff format .
	cd $(FRONTEND_DIR) && yarn run format

lint: ## run linters
	poetry run ruff check .
	cd $(FRONTEND_DIR) && yarn run lint

install_backend: ## install the backend dependencies
	@echo 'Installing backend dependencies'
	@poetry install

install_frontend: ## install frontend dependencies
	@echo 'Installing frontend dependencies'
	cd $(FRONTEND_DIR) && yarn install

build_frontend: ## build the frontend static files
	cd $(FRONTEND_DIR) && CI='' yarn run build

init: check_tools clean_python_cache clean_yarn_cache ## initialize the project
	make install_backend
	make install_frontend
	make build_frontend
	@printf "$(GREEN)All requirements are installed.$(NC)"

start_docker_dev: ## run the development environment in Docker
	sudo chown -R 1001:root ./docker/volumes/db
	mkdir -p ./docker/volumes
	docker compose -f $(COMPOSE_PREFIX).dev.yaml $(COMPOSE_ARGS) up -d --build

stop_docker_dev: ## stop the development environment in Docker
	docker compose -f $(COMPOSE_PREFIX).dev.yaml $(COMPOSE_ARGS) down --rmi all --volumes

start_docker_prod: ## run the production environment in Docker
	sudo chown -R 1001:root ./docker/volumes/db
	mkdir -p ./docker/volumes
	docker compose -f $(COMPOSE_PREFIX).prod.yaml $(COMPOSE_ARGS) up -d --build

stop_docker_prod: ## stop the production environment in Docker
	docker compose -f $(COMPOSE_PREFIX).prod.yaml $(COMPOSE_ARGS) down --rmi all --volumes

unit_tests: ## run unit tests
	poetry run pytest $(BACKEND_DIR)/tests/units

cov_unit_tests: ## run unit tests with coverage
	poetry run pytest -vv --cov=$(BACKEND_DIR)/langboard $(BACKEND_DIR)/tests/units --cov-report=html:./$(BACKEND_DIR)/coverage
	@printf "$(GREEN)Coverage report generated in $(BACKEND_DIR)/coverage directory.$(NC)"