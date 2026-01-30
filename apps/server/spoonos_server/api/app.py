from fastapi import FastAPI

from spoonos_server.api.routes import agent, health


app = FastAPI(title="SpoonOS API")
app.include_router(health.router)
app.include_router(agent.router)
