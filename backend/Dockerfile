# Use a small, production-ready Python image
FROM python:3.11-slim

# Set workdir inside the container
WORKDIR /app

# Install system packages if you want (e.g. curl, unzip) - optional
# RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your app source code
COPY . .

# Make sure Stockfish binary is executable
RUN chmod +x /app/bin/stockfish

# Copy Stockfish binary to PATH
RUN cp /app/bin/stockfish /usr/local/bin/stockfish

# Expose your app port
EXPOSE 8000

# Command to run your app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
