# Imagem de desenvolvimento compartilhada por api e web.
# O código é montado em /workspace em tempo de execução; as dependências
# ficam em volumes nomeados (ver docker-compose.yml) e são instaladas no start.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

ENV PNPM_HOME=/pnpm
# Store fora de /workspace: evita criar .pnpm-store dentro do repositório montado.
ENV npm_config_store_dir=/pnpm/store
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true

WORKDIR /workspace
