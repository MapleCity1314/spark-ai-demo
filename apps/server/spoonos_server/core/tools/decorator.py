import functools
from typing import Callable, Optional, Dict, Any

# 嘗試從 SDK 導入，如果沒有則使用自定義邏輯
try:
    from spoon_ai.tools import tool as sdk_tool
except ImportError:
    # 備用方案: 如果 SDK 沒有直接導出 tool，我們使用 BaseTool 創建簡單的實現
    from spoon_ai.tools.base import BaseTool
    
    def sdk_tool(*args, **kwargs):
        def _decorator(func):
            # 創建一個基於 BaseTool 的簡單包裝
            class SimpleTool(BaseTool):
                name: str = func.__name__
                description: str = func.__doc__ or ""
                parameters: Dict[str, Any] = {}
                
                async def execute(self, *args, **kwargs):
                    return await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
            
            return SimpleTool(name=func.__name__, description=func.__doc__ or "", parameters={})
        
        if len(args) == 1 and callable(args[0]):
            return _decorator(args[0])
        return _decorator

def tool(func: Optional[Callable] = None):
    """
    Tool 裝飾器
    用於將函數標記為 Agent 可用的工具。
    """
    if func:
        return sdk_tool(func)
    return sdk_tool