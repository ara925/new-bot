#!/bin/bash
# TextBuilder.ai Clone Startup Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                  TextBuilder.ai Clone                      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Docker
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}Docker and Docker Compose found.${NC}"
    echo -e "${YELLOW}Do you want to start the application using Docker? (y/n)${NC}"
    read -r use_docker
    
    if [[ $use_docker =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting with Docker Compose...${NC}"
        docker-compose up -d
        echo -e "${GREEN}Application started!${NC}"
        echo -e "Frontend: http://localhost:3000"
        echo -e "Backend API: http://localhost:4000"
        exit 0
    fi
fi

# Manual startup
echo -e "${YELLOW}Starting backend and frontend manually...${NC}"

# Check if MongoDB is running
echo -e "${YELLOW}Checking if MongoDB is running...${NC}"
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}MongoDB is running.${NC}"
else
    echo -e "${RED}MongoDB does not appear to be running on port 27017.${NC}"
    echo -e "${YELLOW}Please start MongoDB before continuing.${NC}"
    exit 1
fi

# Check if Redis is running
echo -e "${YELLOW}Checking if Redis is running...${NC}"
if nc -z localhost 6379 2>/dev/null; then
    echo -e "${GREEN}Redis is running.${NC}"
else
    echo -e "${RED}Redis does not appear to be running on port 6379.${NC}"
    echo -e "${YELLOW}Please start Redis before continuing.${NC}"
    exit 1
fi

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
cd backend || exit
npm install
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating default .env file for backend...${NC}"
    cp .env.example .env || cp ../.env.example .env
fi
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend || exit
npm install
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating default .env.local file for frontend...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
fi
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for processes
echo -e "${GREEN}Application started!${NC}"
echo -e "Frontend: http://localhost:3000"
echo -e "Backend API: http://localhost:4000"
echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"

# Trap Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait
