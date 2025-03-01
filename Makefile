up_db_only:
	docker-compose --profile db up -d

up:
	docker-compose --profile all up -d

down:
	docker-compose --profile all down
