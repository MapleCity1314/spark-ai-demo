import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from spoonos_server.api.routes import agent, health, openai, profile


app = FastAPI(title="SpoonOS API")
cors_origins_env = os.getenv("SPOONOS_CORS_ORIGINS", "*")
cors_origins = (
    ["*"]
    if cors_origins_env.strip() == "*"
    else [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(agent.router)
app.include_router(openai.router)
app.include_router(profile.router)
