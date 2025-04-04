up_db_only:
	docker-compose --profile db up -d

up:
	docker-compose --profile all up -d

down:
	docker-compose --profile all down

up_be_only:
	docker-compose --profile be up -d

up_prod:
	docker-compose -f docker-compose.production.yml --profile all up -d

down_prod:
	docker-compose -f docker-compose.production.yml --profile all down
