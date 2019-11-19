#!/bin/bash

echo 'Waiting for mongo to be up...'

while ! nc -z mongo $MONGO_PORT; do
  sleep 1
done


echo 'Mongo is ready!'