# Nacif Interno — comandos de desenvolvimento
# Uso: make <alvo>. `make help` lista os alvos.

COMPOSE ?= docker compose
SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help install up down restart deps logs ps build migrate migrate-new migrate-deploy generate seed db-reset studio \
	test test-shared test-web test-api test-e2e test-e2e-preview test-e2e-ui lint lint-fix typecheck format format-check vocab-check \
	clean shell-api shell-web shell-db skills-install ci dev-web

help: ## Lista os alvos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Cria .env (se faltar) e instala dependências no host
	@test -f .env || cp .env.example .env
	pnpm install

up: ## Sobe db, api e web em background
	$(COMPOSE) up -d --build

down: ## Derruba os containers (mantém volumes)
	$(COMPOSE) down

restart: ## Reinicia api e web
	$(COMPOSE) restart api web

deps: ## Reinstala dependências nos volumes do Docker (após mudar package.json/lockfile)
	$(COMPOSE) run --rm deps
	$(COMPOSE) restart api web

logs: ## Acompanha logs (make logs s=api)
	$(COMPOSE) logs -f $(s)

ps: ## Lista containers
	$(COMPOSE) ps

build: ## Reconstrói as imagens
	$(COMPOSE) build

migrate: ## Aplica migrações pendentes em dev (cria se houver mudança no schema)
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma migrate dev

migrate-new: ## Cria uma migração nomeada (make migrate-new name=add_x)
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma migrate dev --name $(name)

migrate-deploy: ## Aplica migrações sem prompt (CI/prod)
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma migrate deploy

generate: ## Regera o Prisma Client
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma generate

seed: ## Popula o banco com os dados de exemplo do design
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma db seed

db-reset: ## Apaga o banco, reaplica migrações e roda o seed
	$(COMPOSE) exec api pnpm --filter @nacif/api exec prisma migrate reset --force

studio: ## Abre o Prisma Studio (porta 5555)
	$(COMPOSE) exec -e BROWSER=none api pnpm --filter @nacif/api exec prisma studio --port 5555 --hostname 0.0.0.0

test: test-shared test-web test-api ## Roda todos os testes (exceto e2e)

test-shared: ## Testes unitários do pacote shared
	pnpm --filter @nacif/shared test

test-web: ## Testes de componentes do web
	pnpm --filter @nacif/web test

test-api: ## Testes de integração da API (sobe db-test)
	$(COMPOSE) --profile test up -d --wait db-test
	pnpm --filter @nacif/api test

test-e2e: ## Testes end-to-end com Playwright (exige `make up` + seed)
	pnpm --filter @nacif/e2e test

test-e2e-preview: ## E2E contra o build de produção (vite preview), como no CI
	E2E_PREVIEW=true VITE_API_PROXY_TARGET=http://localhost:$${API_PORT:-3010} pnpm --filter @nacif/e2e test

test-e2e-ui: ## Playwright em modo UI
	pnpm --filter @nacif/e2e test:ui

lint: ## ESLint em todo o repo
	pnpm lint

lint-fix: ## ESLint com --fix
	pnpm lint:fix

typecheck: ## tsc em todos os pacotes
	pnpm typecheck

format: ## Prettier --write
	pnpm format

format-check: ## Prettier --check
	pnpm format:check

vocab-check: ## Falha se encontrar vocabulário proibido na UI ou nas docs
	@./scripts/vocab-check.sh

clean: ## Derruba containers, apaga volumes e artefatos locais
	$(COMPOSE) --profile test down -v --remove-orphans
	rm -rf node_modules apps/*/node_modules packages/*/node_modules e2e/node_modules \
		apps/*/dist packages/*/dist apps/api/src/generated e2e/playwright-report e2e/test-results

shell-api: ## Shell no container da api
	$(COMPOSE) exec api sh

shell-web: ## Shell no container do web
	$(COMPOSE) exec web sh

shell-db: ## psql no banco de desenvolvimento
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-nacif} -d $${POSTGRES_DB:-nacif}

skills-install: ## (Re)instala as skills de agente listadas em scripts/skills.txt
	@./scripts/skills-install.sh

dev-web: ## Alternativa: roda o web nativamente no host (api e db no Docker)
	VITE_API_PROXY_TARGET=http://localhost:$${API_PORT:-3010} pnpm --filter @nacif/web dev

ci: lint typecheck test vocab-check ## Tudo que o CI roda
