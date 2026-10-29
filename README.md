<h3 align="center"><b>Fragata</b></h3>
<p align="center"><b>Orquestração, backup e API para infraestruturas Fragata Host, XCP-ng e XenServer</b></p>

Fragata é um hard fork do Xen Orchestra, iniciado em 29 de outubro de 2026 a partir do commit `a50776cb` do repositório `vatesfr/xen-orchestra`. A partir desse ponto o projeto segue roadmap, versionamento e identidade próprios.

Sem agente nos hosts: o Fragata conversa com os pools pela XAPI. Oferece interface web, CLI, API REST, servidor MCP e um motor de backup completo (full, incremental, replicação contínua, disaster recovery, remotes NFS, SMB e S3).

## Produtos

| Produto | Papel | Origem |
|---|---|---|
| **Fragata** | orquestração, backup e API para um ou mais pools (este repositório) | Xen Orchestra |
| **Fragata Host** | hipervisor e host de virtualização | XCP-ng |
| **Fragata Deck** | interface leve embutida no host (`@fragata/lite`) | XO Lite |

## Estrutura do monorepo

- `packages/fragata-server`: backend, API JSON-RPC e REST, backups, autenticação.
- `packages/fragata-server-*`: plugins (autenticação LDAP, SAML, OIDC, GitHub, Google; alertas; load balancer; Netbox; SDN; transportes de notificação).
- `@fragata/web` e `@fragata/web-core`: interface principal (Vue 3).
- `packages/fragata-web-classic`: interface clássica (React), servida em `/v5`.
- `@fragata/lite`: Fragata Deck.
- `@fragata/backups`, `@fragata/backup-archive`, `@fragata/fs`, `packages/vhd-lib`: motor de backup e storage remoto.
- `@fragata/rest-api`, `@fragata/mcp`, `packages/fragata-cli`: API REST, servidor MCP e CLI.

## Rodando a partir do código

Requisitos: Node.js LTS, Yarn 1.x, Redis e as dependências de sistema listadas em `docs/docs/getting-started/install-from-sources.md`.

```bash
yarn
yarn build
cd packages/fragata-server
node dist/cli.mjs
```

Configuração em `/etc/fragata-server/config.toml` ou `~/.config/fragata-server/config.toml`. Um ambiente em container (Podman ou Docker) com Redis está descrito no repositório de infraestrutura do projeto.

## Branches

- `main`: linha de desenvolvimento do Fragata.
- `upstream`: cópia congelada do ponto de origem (tag `upstream-base`), mantida só para referência e cherry-pick seletivo de correções de segurança. Nunca é mergeada.

## Licença

AGPL-3.0, a mesma do projeto de origem. Os avisos de copyright da Vates SAS nos pacotes são mantidos; veja `LICENSE.md`.

## Origem e marcas

O Xen Orchestra é um projeto da Vates SAS. "Xen Orchestra", "XOA", "XO" e "XCP-ng" são marcas de seus respectivos donos e não são usadas por este projeto; "Xen" é marca do Xen Project. Nomes de pacote como `xen-api` e `xapi` descrevem o protocolo e não uma marca.
