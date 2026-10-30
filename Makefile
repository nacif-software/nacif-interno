# Nacif Interno — comandos de desenvolvimento
# Uso: make <alvo>. `make help` lista os alvos. Sem Docker: o Worker roda local com `wrangler dev`.

SHELL := /bin/bash
.DEFAULT_GOAL := help
API := pnpm --filter @nacif/api

.PHONY: help install dev dev-api dev-web types migrate migrate-new seed db-reset create-admin build-web deploy-check \
	test test-shared test-web test-api test-e2e test-e2e-ui lint lint-fix typecheck format format-check vocab-check \
	clean skills-install ci

help: ## Lista os alvos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependências, cria .dev.vars, gera tipos do Worker e aplica as migrações no D1 local
	pnpm install
	@test -f apps/api/.dev.vars || cp apps/api/.dev.vars.example apps/api/.dev.vars
	$(MAKE) types
	$(MAKE) migrate

dev: ## Sobe o Worker (API, :8787) e o Vite (web, :5173) juntos
	pnpm dev

dev-api: ## Só o Worker (wrangler dev, :8787)
	$(API) dev

dev-web: ## Só o web (Vite, :5173, proxy de /api para :8787)
	pnpm --filter @nacif/web dev

types: ## Regera worker-configuration.d.ts a partir do wrangler.jsonc
	$(API) types

migrate: ## Aplica as migrações pendentes no D1 local
	$(API) migrate

migrate-new: ## Gera uma migração a partir do schema (make migrate-new name=add_x)
	$(API) migrate:new --name $(name)

seed: ## Popula o D1 local com os dados de exemplo do design
	$(API) seed

db-reset: ## Apaga o D1 local, reaplica migrações e roda o seed
	rm -rf apps/api/.wrangler/state
	$(MAKE) migrate
	$(MAKE) seed

create-admin: ## Cria/promove um administrador e imprime o link de senha (make create-admin email=x@nacif.xyz [db=local])
	@test -n "$(email)" || { echo "Uso: make create-admin email=x@nacif.xyz [db=local]"; exit 1; }
	$(API) create-admin $(email) $(if $(filter local,$(db)),--local,)

build-web: ## Build de produção do web (servido pelo Worker como Static Assets)
	pnpm --filter @nacif/web build

deploy-check: build-web ## Valida o bundle do Worker sem publicar (wrangler deploy --dry-run)
	$(API) deploy:check

test: test-shared test-web test-api ## Roda todos os testes (exceto e2e)

test-shared: ## Testes unitários do pacote shared
	pnpm --filter @nacif/shared test

test-web: ## Testes de componentes do web
	pnpm --filter @nacif/web test

test-api: ## Testes de integração da API no runtime Workers com D1 local
	$(API) test

test-e2e: ## Playwright contra o build de produção servido por `wrangler dev` (sobe sozinho)
	pnpm --filter @nacif/e2e test

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

clean: ## Apaga dependências, builds, estado local do D1 e relatórios
	rm -rf node_modules apps/*/node_modules packages/*/node_modules e2e/node_modules \
		apps/*/dist packages/*/dist apps/api/.wrangler apps/api/worker-configuration.d.ts \
		e2e/playwright-report e2e/test-results

skills-install: ## (Re)instala as skills de agente listadas em scripts/skills.txt
	@./scripts/skills-install.sh

ci: lint typecheck test vocab-check deploy-check ## Tudo que o CI roda
