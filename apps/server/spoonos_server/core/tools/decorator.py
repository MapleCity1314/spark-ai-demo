import functools
from typing import Callable, Optional

# 嘗試從 SDK 導入，如果沒有則使用自定義邏輯
try:
    from spoon_ai.tools import tool as sdk_tool
except ImportError:
    # 備用方案: 如果 SDK 沒有直接導出 tool，我們使用 langchain 風格的封裝
    from spoon_ai.tools.base import StructuredTool
    
    def sdk_tool(*args, **kwargs):
        def _decorator(func):
            return StructuredTool.from_function(func, **kwargs)
        
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