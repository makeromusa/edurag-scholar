import multiprocessing
import os

bind = f"0.0.0.0:{os.environ.get('PORT', 8000)}"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 600
graceful_timeout = 600
keepalive = 120
max_requests = 1000
max_requests_jitter = 50
accesslog = "-"
errorlog = "-"
loglevel = "info"
