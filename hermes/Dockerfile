FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip git curl && rm -rf /var/lib/apt/lists/*

RUN pip3 install uv --break-system-packages

RUN mkdir -p /root/.hermes && \
    git clone https://github.com/NousResearch/hermes-agent /root/.hermes/hermes-agent && \
    cd /root/.hermes/hermes-agent && \
    uv pip install --system -e "."

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8765

ENTRYPOINT ["/entrypoint.sh"]
