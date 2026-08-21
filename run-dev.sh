#!/bin/bash

echo "Starting Hotel Management System Development Servers..."
echo ""

echo "Starting Backend Server..."
cd backend/Hotel.API
dotnet run &
BACKEND_PID=$!

echo ""
echo "Starting Frontend Server..."
cd ../..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5134"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Function to kill both processes when script is interrupted
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to call cleanup function on script exit
trap cleanup EXIT INT TERM

# Wait for both processes
wait