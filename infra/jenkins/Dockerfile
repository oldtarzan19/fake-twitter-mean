FROM jenkins/jenkins:lts-jdk17

USER root

# Függőségek telepítése
RUN apt-get update && apt-get install -y \
    docker.io \
    curl \
    jq \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Docker Compose V2 plugin
RUN DOCKER_CONFIG=/usr/libexec/docker/cli-plugins \
    && mkdir -p "${DOCKER_CONFIG}" \
    && curl -fsSL https://github.com/docker/compose/releases/download/v2.30.3/docker-compose-linux-x86_64 -o "${DOCKER_CONFIG}/docker-compose" \
    && chmod +x "${DOCKER_CONFIG}/docker-compose"

# Docker csoport létrehozása (GID később dinamikusan állítódik)
RUN groupadd -g 999 docker || true

# Entrypoint script bemásolása
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER jenkins

# GitHub SSH host key előzetes elfogadása
RUN mkdir -p /var/jenkins_home/.ssh && \
    ssh-keyscan github.com >> /var/jenkins_home/.ssh/known_hosts && \
    chmod 600 /var/jenkins_home/.ssh/known_hosts

# Egyedi entrypoint használata
USER root
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
