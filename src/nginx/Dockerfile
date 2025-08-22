FROM debian:11

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install nginx openssl

RUN rm -rf var/www/html/index.nginx-debian.html

COPY tools/script.sh /bin/script.sh

RUN chmod +x /bin/script.sh

RUN mkdir -p /etc/nginx/certificates

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certificates/nginx_ssl.key \
    -out /etc/nginx/certificates/nginx_ssl.crt \
    -subj "/C=MA/CN=localhost"

COPY conf/nginx.conf /etc/nginx/sites-available/default

WORKDIR /var/www/html

COPY ./frontend/ .


ENTRYPOINT ["nginx" , "-g", "daemon off;"]