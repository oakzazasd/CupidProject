#!/bin/bash

PROJECT_DIR=/home/ubuntu/CupidProject
BACKEND_DIR=$PROJECT_DIR/backend
FRONTEND_DIR=$PROJECT_DIR/frontend
PYTHON=$PROJECT_DIR/.venv/bin/python

BACKEND_SESSION=Cupid_Backend
FRONTEND_SESSION=Cupid_Frontend

BACKEND_PORT=5050
FRONTEND_PORT=5173

# Stop any existing sessions with these names
for SESSION in "$BACKEND_SESSION" "$FRONTEND_SESSION"; do
    if screen -ls | grep -q "\.${SESSION}"; then
        echo "Stopping existing session: $SESSION"
        screen -S "$SESSION" -X quit
        sleep 1
    fi
done

# Install/update dependencies (dev deps are required for the build)
echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR" || exit 1
if ! npm install --include=dev; then
    echo "Frontend dependency install failed. Aborting."
    exit 1
fi

# Build the production bundle before starting the frontend
echo "Building frontend..."
if ! npm run build; then
    echo "Frontend build failed. Aborting."
    exit 1
fi

# Start backend
screen -dmS "$BACKEND_SESSION" bash -c "cd '$BACKEND_DIR' && PORT=$BACKEND_PORT exec '$PYTHON' app.py"

# Start frontend (production static server, not the Vite dev server)
screen -dmS "$FRONTEND_SESSION" bash -c "cd '$FRONTEND_DIR' && PORT=$FRONTEND_PORT API_TARGET=http://127.0.0.1:$BACKEND_PORT exec node server.mjs"

sleep 2
screen -ls
echo
echo "Backend:  screen -r $BACKEND_SESSION"
echo "Frontend: screen -r $FRONTEND_SESSION"
echo "Frontend URL: http://localhost:$FRONTEND_PORT/"
echo
curl -fsS -o /dev/null "http://127.0.0.1:$FRONTEND_PORT/" && echo "Frontend: OK" || echo "Frontend: not responding yet"
curl -fsS -o /dev/null "http://127.0.0.1:$BACKEND_PORT/api/config" && echo "Backend:  OK" || echo "Backend:  not responding yet"
