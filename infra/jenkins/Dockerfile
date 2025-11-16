FROM jenkins/jenkins:lts-jdk17

USER root
RUN apt-get update && apt-get install -y \
    docker.io \
    curl \
    jq \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*
# Docker CLI plugin includes compose V2 (`docker compose`)
RUN DOCKER_CONFIG=/usr/libexec/docker/cli-plugins \
    && mkdir -p "${DOCKER_CONFIG}" \
    && curl -fsSL https://github.com/docker/compose/releases/download/v2.30.3/docker-compose-linux-x86_64 -o "${DOCKER_CONFIG}/docker-compose" \
    && chmod +x "${DOCKER_CONFIG}/docker-compose"
RUN groupadd -g 999 docker || true && usermod -aG docker jenkins

USER jenkins

# GitHub SSH host key előzetes elfogadása
RUN mkdir -p /var/jenkins_home/.ssh && \
    ssh-keyscan github.com >> /var/jenkins_home/.ssh/known_hosts && \
    chmod 600 /var/jenkins_home/.ssh/known_hosts
