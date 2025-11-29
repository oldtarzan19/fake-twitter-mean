FROM nginx:1.27-alpine
RUN mkdir -p /etc/nginx/certs
COPY nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf
COPY certs/*.pem /etc/nginx/certs/
