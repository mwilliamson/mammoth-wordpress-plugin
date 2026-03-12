FROM wordpress:6.9.4-php8.2-apache

RUN mkdir -p /opt/wp-cli && \
    cd /opt/wp-cli && \
    curl -L https://github.com/wp-cli/wp-cli/releases/download/v2.12.0/wp-cli-2.12.0.phar > wp-cli.phar
COPY wp /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp
