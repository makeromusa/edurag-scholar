#!/bin/bash
if [ -d "backend" ]; then
    cd backend
fi
gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 600 app.main:app
