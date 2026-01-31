import os
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

# ------------------------------------------------------------------------------
# 修改點 1: 更穩健的路徑設定
# ------------------------------------------------------------------------------
# 取得目前檔案 (upload.py) 的位置 -> .../spoonos_server/api/routes/
# 我們希望 uploads 資料夾建立在 apps/server/uploads (專案根目錄下)
# 所以往上找 4 層: routes -> api -> spoonos_server -> server -> apps/server
# 或者簡單點，直接指定在 apps/server 的工作目錄下 (通常是執行點)
# 這裡使用最保險的方式：基於 Server 根目錄
# 假設專案結構是標準的，我們把它放在 apps/server/uploads
SERVER_ROOT = Path(os.getcwd()) # 通常啟動點都在 apps/server
if (SERVER_ROOT / "apps" / "server").exists():
     SERVER_ROOT = SERVER_ROOT / "apps" / "server"

UPLOAD_DIR = SERVER_ROOT / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    [模塊一] 交易文件上傳接口
    """
    try:
        # 1. 確保檔名安全 (處理路徑遍歷攻擊)
        safe_filename = Path(file.filename).name
        
        # 2. 定義儲存路徑
        file_path = UPLOAD_DIR / safe_filename
        
        # 3. 寫入檔案 (使用 with open 確保資源釋放)
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 4. 回傳絕對路徑
        # 注意：這裡使用 resolve() 獲取真正的絕對路徑，避免相對路徑造成 Agent 讀不到
        abs_path = str(file_path.resolve())
        
        return {
            "status": "success",
            "filename": safe_filename,
            "file_path": abs_path, 
            # ------------------------------------------------------------------
            # 修改點 2: 保持與舊版一致的提示訊息
            # ------------------------------------------------------------------
            "message": "上傳成功！請將 file_path 提供給 Agent 進行分析。"
        }
    except Exception as e:
        # 使用 500 錯誤碼回傳詳細錯誤，方便前端除錯
        raise HTTPException(status_code=500, detail=f"文件上傳失敗: {str(e)}")