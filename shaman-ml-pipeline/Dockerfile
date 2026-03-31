FROM python:3.11-slim

WORKDIR /app

# Install deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

# Model + data dirs (populated via volume mounts)
RUN mkdir -p models data

EXPOSE 5001

CMD ["python", "src/model_server.py"]
