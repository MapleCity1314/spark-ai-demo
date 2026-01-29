try:
    from fastmcp import FastMCP
except Exception:  # pragma: no cover - optional dependency
    FastMCP = None


def main() -> None:
    if FastMCP is None:
        raise RuntimeError("fastmcp is not installed. Install deps and retry.")

    mcp = FastMCP("test-mcp")

    @mcp.tool()
    def ping(text: str = "pong") -> str:
        return f"ping:{text}"

    @mcp.tool()
    def echo(text: str) -> str:
        return text

    @mcp.tool()
    def add(a: float, b: float) -> float:
        return a + b

    mcp.run()


if __name__ == "__main__":
    main()
