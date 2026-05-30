from fastapi import FastAPI  # type: ignore[import]

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello"}