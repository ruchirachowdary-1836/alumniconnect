#!/bin/bash
echo "Starting Alumni Link Backend..."
cd "$(dirname "$0")/backend"
mvn spring-boot:run
