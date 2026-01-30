import os
import shutil
from pathlib import Path
from fastapi import UploadFile, File
from spoonos_server.server.app import app  # 保持原本的導入，這是主程式

# --- [模塊一核心] 檔案上傳基礎設施 ---

# 1. 設定上傳目錄
# 這會在 apps/server/ 下自動建立一個 'uploads' 資料夾
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    [Investment Profiler 專用接口]
    接收前端上傳的交易文件 (CSV/Excel)，存到伺服器本地，並返回絕對路徑。
    """
    try:
        # 為了防止檔名重複，你也可以在這裡加上時間戳記 (uuid)
        # 目前保持原檔名，方便你測試
        safe_filename = os.path.basename(file.filename)
        file_location = UPLOAD_DIR / safe_filename
        
        # 2. 將上傳的文件寫入磁碟 (Stream 寫入，節省記憶體)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. 獲取絕對路徑 (這是 Python Tool 讀取所需的關鍵參數)
        absolute_path = str(file_location.resolve())
        
        print(f"✅ [Upload] 文件已保存至: {absolute_path}")
        
        return {
            "status": "success", 
            "file_path": absolute_path,  # <--- 前端拿到這個路徑後，要塞進 Prompt 裡
            "filename": safe_filename,
            "message": "上傳成功！請將 file_path 提供給 Agent 進行分析。"
        }
    except Exception as e:
        print(f"❌ [Upload Error] {str(e)}")
        return {"status": "error", "message": str(e)}

# 導出 app 供 uvicorn 啟動
__all__ = ["app"]