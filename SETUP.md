# Hermes — Agente de Viajes con IA

Sistema de agente de viajes con IA. Arquitectura full-stack con un agente Agno en el core, backend FastAPI, y frontend Next.js. Todo dockerizado.

## Stack

- **Backend**: Python, FastAPI, Agno, MCP
- **Frontend**: Next.js + TypeScript
- **Agente IA**: Agno + OpenRouter
- **Infraestructura**: Docker + docker-compose

## Variables de entorno

Crear `.env` en la raíz con:

```
OPENROUTER_API_KEY=
```

## Inicio rápido

```bash
git clone https://github.com/emzza/hermes-agencia-viajes.git
cd HermesAgenciaViajes
cp .env.example .env  # si existe, sino crear .env manualmente
docker-compose up --build
```

Servicios:
- `hermes` — agente Agno en puerto 8765
- `backend` — FastAPI en puerto 8000
- `frontend` — Next.js en puerto 3000

## Estructura

```
backend/    FastAPI + agentes + tools
frontend/   Next.js UI
hermes/     Agente Agno core
docker-compose.yml
```

## Prompt para Claude

```
Estoy trabajando en Hermes, un sistema de agente de viajes con IA.

Stack: Python FastAPI (backend), Next.js TypeScript (frontend), Agno framework (agente IA), OpenRouter (LLM), Docker Compose.
Repo: https://github.com/emzza/hermes-agencia-viajes

Estructura:
- backend/ — FastAPI, agentes Agno, tools, config.py, db.py, main.py
- frontend/ — Next.js UI
- hermes/ — core del agente Agno (puerto 8765)
- docker-compose.yml — orquesta los tres servicios

Variable de entorno crítica: OPENROUTER_API_KEY

Levantá con: docker-compose up --build

Ayudame a retomar el desarrollo.
```
