#!/bin/bash
set -e

# Jenkins Java opciók beállítása (local Git checkout engedélyezése)
export JAVA_OPTS="${JAVA_OPTS} -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true"

# Docker socket GID lekérése a host-ról
DOCKER_SOCKET=/var/run/docker.sock

if [ -S "$DOCKER_SOCKET" ]; then
    DOCKER_GID=$(stat -c '%g' "$DOCKER_SOCKET")
    echo "Docker socket GID: $DOCKER_GID"

    # Ha a Docker socket GID 0 (root), akkor a jenkins usert a root csoporthoz adjuk
    if [ "$DOCKER_GID" -eq 0 ]; then
        echo "Docker socket is owned by root group (GID 0)"
        echo "Jenkins user hozzáadva a root csoporthoz"
    else
        # Docker csoport kezelése, ha a GID nem 0
        if getent group docker > /dev/null 2>&1; then
            CURRENT_DOCKER_GID=$(getent group docker | cut -d: -f3)
            if [ "$CURRENT_DOCKER_GID" != "$DOCKER_GID" ]; then
                groupmod -g "$DOCKER_GID" docker
                echo "Docker csoport GID módosítva: $DOCKER_GID"
            else
                echo "Docker csoport GID már helyes: $DOCKER_GID"
            fi
        else
            groupadd -g "$DOCKER_GID" docker
            echo "Docker csoport létrehozva GID-del: $DOCKER_GID"
        fi

        # Jenkins user hozzáadása a docker csoporthoz
        usermod -aG docker jenkins
        echo "Jenkins user hozzáadva a docker csoporthoz (GID: $DOCKER_GID)"
    fi
else
    echo "WARNING: Docker socket nem található: $DOCKER_SOCKET"
fi

# Eredeti Jenkins entrypoint futtatása
exec /usr/local/bin/jenkins.sh "$@"
