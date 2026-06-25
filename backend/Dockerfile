FROM python:3.12-slim

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# Instalar uv (requerido por hermes-agent)
RUN pip install uv

# Instalar Hermes Agent
RUN git clone https://github.com/NousResearch/hermes-agent /opt/hermes-agent
RUN cd /opt/hermes-agent && uv pip install --system -e "."

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
