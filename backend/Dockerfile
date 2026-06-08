FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

# CPU-only torch first
RUN pip install --no-cache-dir torch==2.12.0 --index-url https://download.pytorch.org/whl/cpu

# Install everything from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Force downgrade pydantic to compatible version AFTER requirements
# This overrides the 2.13.4 that requirements.txt installs
RUN pip install --no-cache-dir --force-reinstall "pydantic==2.10.6" "pydantic-core==2.27.2"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]