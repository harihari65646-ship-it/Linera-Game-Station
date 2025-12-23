# Neon Arcade - Linera Gaming Platform
# Memory-efficient Docker image (based on microcard approach)
FROM rust:1.86-slim

SHELL ["bash", "-c"]

# System dependencies (matching microcard but with additional SSL/CA certs for your setup)
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    git \
    curl \
    jq \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Clone and build Linera (MEMORY-EFFICIENT: build only what's needed)
# This matches microcard's approach - cargo install is more memory-efficient than cargo build --release
RUN git clone https://github.com/linera-io/linera-protocol.git && \
    cd linera-protocol && \
    git checkout -t origin/testnet_conway && \
    git checkout 288296873fb92eda7ced5e825d5c1d0dd49aec42 && \
    cargo install --locked --path linera-service --jobs 2 && \
    cd .. && \
    rm -rf linera-protocol

# Install Node.js (using microcard's approach with NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm http-server

# Add wasm32 target for Linera contracts
RUN rustup target add wasm32-unknown-unknown

WORKDIR /build

# Health check for multi-player setup
HEALTHCHECK --start-period=20m --interval=30s --timeout=10s --retries=10 \
    CMD bash -c "curl -sf http://localhost:5173 && curl -sf http://localhost:5174 && curl -sf http://localhost:5175" || exit 1

# Expose ports for 3 players
# Frontends: 5173-5175, GraphQL: 9002-9004, Faucet: 8080, Validators: 13001-13003
EXPOSE 5173 5174 5175 8080 9002 9003 9004 13001 13002 13003

# Multi-player entrypoint
COPY run-multiplayer.bash /build/run-multiplayer.bash
RUN chmod +x /build/run-multiplayer.bash
ENTRYPOINT ["/bin/bash", "/build/run-multiplayer.bash"]
