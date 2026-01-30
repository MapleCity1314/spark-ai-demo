from spoonos_server.api.routes.agent import router as agent_router
from spoonos_server.api.routes.health import router as health_router
from spoonos_server.api.routes.profile import router as profile_router

__all__ = ["agent_router", "health_router", "profile_router"]
