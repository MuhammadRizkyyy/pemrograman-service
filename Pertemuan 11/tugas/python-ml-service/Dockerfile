FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

RUN python train_model.py

EXPOSE 3091

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3091"]
