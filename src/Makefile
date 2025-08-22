up-build:
	docker compose -f docker-compose.yml up --build

up:
	docker compose -f docker-compose.yml up

build:
	docker compose -f docker-compose.yml build

down:
	docker compose -f docker-compose.yml down

start:
	docker compose -f docker-compose.yml start

stop:
	docker compose -f docker-compose.yml stop

restart:
	docker compose -f docker-compose.yml restart

logs:
	docker compose -f docker-compose.yml logs

ps:
	docker compose -f docker-compose.yml ps

rm-ps:
	docker rm -f $$(docker ps -aq)

rm-images:
	docker rmi $$(docker images -aq)

rm-services: 
	docker compose -f docker-compose.yml down --rmi all -v

rm-volumes:
	docker volume rm $$(docker volume ls -q)

rm-networks:
	docker network rm $$(docker network ls -q)

prune:
	docker network prune -f
	docker volume prune -f
	docker system prune -f


remove-all: rm-services prune
	