FROM python:3.12-slim

RUN apt-get update && apt-get install -y git curl nodejs npm && rm -rf /var/lib/apt/lists/*

RUN pip install uv

RUN mkdir -p /root/.hermes && \
    git clone https://github.com/NousResearch/hermes-agent /root/.hermes/hermes-agent && \
    cd /root/.hermes/hermes-agent && \
    uv pip install --system -e "." && \
    pip install mcp

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8765

ENTRYPOINT ["/entrypoint.sh"]
