#!/bin/bash
set -e

# Docker socket GID lekérése a host-ról
DOCKER_SOCKET=/var/run/docker.sock

if [ -S "$DOCKER_SOCKET" ]; then
    DOCKER_GID=$(stat -c '%g' "$DOCKER_SOCKET")
    echo "Docker socket GID: $DOCKER_GID"

    # Docker csoport módosítása a megfelelő GID-re
    if getent group docker > /dev/null 2>&1; then
        groupmod -g "$DOCKER_GID" docker
    else
        groupadd -g "$DOCKER_GID" docker
    fi

    # Jenkins user hozzáadása a docker csoporthoz
    usermod -aG docker jenkins

    echo "Jenkins user hozzáadva a docker csoporthoz (GID: $DOCKER_GID)"
else
    echo "WARNING: Docker socket nem található: $DOCKER_SOCKET"
fi

# Eredeti Jenkins entrypoint futtatása
exec /usr/local/bin/jenkins.sh "$@"
