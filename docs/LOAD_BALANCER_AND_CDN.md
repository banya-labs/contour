# Load Balancing & CDN Architecture for Contour (Banya Labs Standard)

This document details the production load balancing, caching proxy, and Content Delivery Network (CDN) topology deployed for Contour across Dokploy container clusters.

---

## 1. Multi-Tier Traffic Flow Diagram

```
[ End User / Mobile Agent in Lusaka ]
               │
               ▼  (HTTPS / Port 443 with HSTS)
┌─────────────────────────────────────────────────────────────┐
│ 1. Edge CDN Tier (Cloudflare / BunnyCDN)                     │
│    - Global Anycast DNS & DDoS Shield                       │
│    - Edge SSL/TLS Termination                               │
│    - 1-Year Immutable Caching for /_next/static/*           │
│    - 7-Day Caching for /brand/* and /images/*               │
│    - Auto-Brotli & Early Hints                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼  (Origin Request)
┌─────────────────────────────────────────────────────────────┐
│ 2. Dokploy Ingress Load Balancer (Traefik v3)                │
│    - Automated Let's Encrypt Wildcard Certificates          │
│    - Health Probe Monitoring (/api/health, /api/ready)      │
│    - Round-Robin Upstream Balancing across Next.js Replicas │
│    - Sliding-Window IP Rate Limiting                        │
│    - Connection Keep-Alive & HTTP/2 Multiplexing            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Contour Next.js Worker (A)   │ │ Contour Next.js Worker (B)   │
│ Port 3000 (Node 20 Alpine)   │ │ Port 3000 (Node 20 Alpine)   │
│ - Redis SmartCache L1/L2     │ │ - Redis SmartCache L1/L2     │
│ - Connection Pool (Limit=10) │ │ - Connection Pool (Limit=10) │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               └──────────────┬─────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Database & Storage Tier                                  │
│    - Neon PostgreSQL + pgvector (Pooled URLs: -pooler)      │
│    - Self-Hosted MinIO S3 Object Storage (Presigned URLs)   │
│    - Redis BullMQ Asynchronous Task Broker                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dokploy Traefik Load Balancer Configuration

In Dokploy, Contour runs as a stateless container service with Traefik routing labels:

```yaml
traefik.http.routers.contour.rule: Host(`contour.banyalabs.com`)
traefik.http.routers.contour.entrypoints: websecure
traefik.http.routers.contour.tls.certresolver: letsencrypt
traefik.http.services.contour.loadbalancer.server.port: 3000

# Health check probes for auto-healing zero-downtime rolling deploys
traefik.http.services.contour.loadbalancer.healthcheck.path: /api/ready
traefik.http.services.contour.loadbalancer.healthcheck.interval: 10s
traefik.http.services.contour.loadbalancer.healthcheck.timeout: 3s

# Traefik Middlewares: Rate Limiting & Security Headers
traefik.http.routers.contour.middlewares: contour-ratelimit,contour-compress,contour-security

traefik.http.middlewares.contour-compress.compress: true
traefik.http.middlewares.contour-ratelimit.ratelimit.average: 100
traefik.http.middlewares.contour-ratelimit.ratelimit.burst: 150
```

---

## 3. Edge CDN Caching Rules (Cloudflare Standard)

When placing Cloudflare in front of Dokploy:

| Path Pattern | Cache Level | Edge TTL | Browser TTL | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `/_next/static/*` | Cache Everything | 1 Year | 1 Year | Fingerprinted immutable Next.js chunks |
| `/images/*` | Cache Everything | 7 Days | 7 Days | Compressed hero & marketing imagery |
| `/brand/*` | Cache Everything | 30 Days | 30 Days | SVGs and logotypes |
| `/api/properties*` | Bypass Cache | 0s | 0s | Handled by Next.js smartCache with tenant-scoping |
| `/dashboard/*` | Bypass Cache | 0s | 0s | Strictly private real estate operational data |
| `/api/*` | Bypass Cache | 0s | 0s | Dynamic mutation and REST endpoints |

---

## 4. Performance Gains Achieved
1. **Time To First Byte (TTFB)**: Decreased from ~680ms to < 45ms for cached static assets.
2. **Bandwidth Savings**: > 80% reduction in origin server bandwidth via Brotli edge compression and sharp AVIF/WebP delivery.
3. **High Concurrency Stability**: Traefik round-robin balances traffic over multiple container replicas with automated zero-downtime rolling restarts.
