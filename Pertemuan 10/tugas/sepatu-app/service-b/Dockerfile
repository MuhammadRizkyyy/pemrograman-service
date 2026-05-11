FROM php:8.3-cli

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

COPY . .

EXPOSE 34501

CMD ["php", "-S", "0.0.0.0:34501", "-t", "/app"]
