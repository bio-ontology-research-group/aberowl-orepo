#!/bin/bash

PORT=3333 node prerender/server.js&
sleep 3
PRERENDER_SERVICE_URL=http://localhost:3333 ./bin/www
