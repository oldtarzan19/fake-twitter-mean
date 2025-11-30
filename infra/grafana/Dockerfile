FROM grafana/grafana:11.2.2

USER root

# Copy provisioning files into the image
COPY provisioning /etc/grafana/provisioning

# Set correct permissions (Grafana uses UID/GID 472)
RUN chown -R 472:472 /etc/grafana/provisioning

USER 472
