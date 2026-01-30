import functools

def tool(func):
    """
    一個簡單的裝飾器，用於將函數標記為 Agent 可用的工具。
    它會保留函數原本的名稱和文檔字符串 (Docstring)。
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    
    # 標記這個函數是一個 tool (供註冊表掃描用)
    wrapper.is_tool = True
    return wrapper