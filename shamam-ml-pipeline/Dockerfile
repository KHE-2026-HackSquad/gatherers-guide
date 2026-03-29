FROM python:3.11-slim

WORKDIR /app

# Install deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

# Model + data dirs (populated via volume mounts)
RUN mkdir -p models data

EXPOSE 5001

# If model doesn't exist yet, train it first then serve
CMD ["sh", "-c", "if [ ! -f models/shaman_xgb.pkl ]; then echo 'No model found — run: docker compose run shaman-model python src/train_model.py'; exit 1; fi && python src/model_server.py"]
