# Azure Migration

## Current Azure Runtime

- Resource group: `rg-leeminsoft-prod-krc`
- VM: `vm-playongym-prod`
- Public IP: `20.196.209.245`
- App directory: `/opt/casual-game-world`
- Runtime: Node.js 24
- Process manager: PM2 app `casual-game-world`
- App port: `3001`
- Nginx hostnames: `gamezip.kr`, `www.gamezip.kr`
- Persistent SQLite path: `/opt/casual-game-world/shared/data/casual-game-world.sqlite`

## Deploy

```bash
npm run azure:deploy:vm
```

The deploy command builds the monorepo, creates `.azure-deploy/casual-game-world-app.zip`, uploads it to the Azure VM, installs Node.js 24 if needed, reloads PM2, and updates the Nginx server block for `gamezip.kr`.

## Azure DNS

An Azure DNS zone exists for `gamezip.kr`.

Azure nameservers:

```text
ns1-09.azure-dns.com.
ns2-09.azure-dns.net.
ns3-09.azure-dns.org.
ns4-09.azure-dns.info.
```

Records:

```text
gamezip.kr.      A 20.196.209.245
www.gamezip.kr.  A 20.196.209.245
```

The public domain is still delegated to Google nameservers until the registrar nameserver setting is changed.

## After DNS Delegation

After `gamezip.kr` resolves to `20.196.209.245`, issue TLS certificates:

```bash
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes playongym@20.196.209.245 \
  'sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d gamezip.kr -d www.gamezip.kr'
```
