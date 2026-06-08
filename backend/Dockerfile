FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

# Install CPU-only torch first (avoids 6GB CUDA libraries)
RUN pip install --no-cache-dir torch==2.12.0 --index-url https://download.pytorch.org/whl/cpu

# Install pydantic-core with a version that has Linux wheels
RUN pip install --no-cache-dir pydantic-core==2.27.2

# Install everything else without re-resolving deps
RUN pip install --no-cache-dir -r requirements.txt --no-deps

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]