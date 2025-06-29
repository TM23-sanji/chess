FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make sure stockfish is executable
RUN chmod +x bin/stockfish

# Add it to PATH if you want
ENV PATH="/app/bin:${PATH}"

CMD ["uvicorn", "runserver:app", "--host", "0.0.0.0", "--port", "8000"]
