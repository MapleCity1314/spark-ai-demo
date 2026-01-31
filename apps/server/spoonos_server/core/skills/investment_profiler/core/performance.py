import pandas as pd
import quantstats as qs
import numpy as np
import os

class PerformanceEngine:
    def process_trade_history(self, file_path: str) -> dict:
        """
        全能型交易文件讀取器：支持 Excel, 標準 CSV, 以及帶雜訊 Header 的 CSV
        """
        df = pd.DataFrame()
        try:
            # --- 階段 1: 智能讀取 (Smart Ingestion) ---
            if file_path.endswith(('.xlsx', '.xls')):
                try:
                    df = pd.read_excel(file_path)
                except Exception as e:
                    return {"error": f"Excel 讀取失敗: {str(e)}"}
            else:
                # CSV 處理邏輯
                encodings = ['utf-8', 'utf-8-sig', 'big5', 'gbk']
                success = False
                
                for enc in encodings:
                    try:
                        # 策略 A: 先讀第一行看看長什麼樣
                        # header=None 代表先不要把第一行當標題
                        preview = pd.read_csv(file_path, encoding=enc, nrows=2, header=None)
                        first_cell = str(preview.iloc[0, 0])
                        
                        # 檢測 AssetChangeDetails 格式 (特徵: 第一行開頭是 UID:)
                        if "UID:" in first_cell or "Company Name" in first_cell:
                            # 策略 B: 跳過雜訊行 (skiprows=1)
                            df = pd.read_csv(file_path, encoding=enc, skiprows=1)
                        else:
                            # 策略 C: 標準讀取
                            df = pd.read_csv(file_path, encoding=enc)
                        
                        if not df.empty:
                            success = True
                            break
                    except:
                        continue
                
                if not success:
                    return {"error": "無法識別文件編碼，請嘗試轉存為 UTF-8 CSV"}

            # --- 階段 2: 欄位識別 (Column Mapping) ---
            if df.empty:
                return {"error": "文件為空"}

            # 清洗欄位名稱 (去除空格)
            df.columns = [str(c).strip() for c in df.columns]
            
            # 定義我們的「字典」，讓程式能看懂不同交易所的語言
            col_map = {
                'time': ['Time(UTC)', 'Time', 'Date', '開倉時間', 'Created Time', '交易時間', 'datetime'],
                'profit': ['Change', 'Profit', 'Realized PNL', '已實現收益', 'Amount', 'PNL', 'Cash Flow']
            }
            
            target_cols = {}
            for key, candidates in col_map.items():
                for col in candidates:
                    if col in df.columns:
                        target_cols[key] = col
                        break
            
            if 'time' not in target_cols or 'profit' not in target_cols:
                return {"error": f"欄位識別失敗。檢測到的欄位: {list(df.columns)}"}

            # --- 階段 3: 數據計算 (Quant Analysis) ---
            # 轉換時間
            df['Time'] = pd.to_datetime(df[target_cols['time']])
            df.set_index('Time', inplace=True)
            df.sort_index(inplace=True)
            
            # 提取損益序列
            pnl_series = df[target_cols['profit']]
            
            # 數據清洗：把非數字轉為 0 (例如 'TRANSFER' 這種文字)
            pnl_series = pd.to_numeric(pnl_series, errors='coerce').fillna(0)

            # 估算本金 (用於計算收益率 %)
            # 邏輯：如果總流水很大，假設本金是流水的 10%；否則假設固定 1000U
            total_flow = pnl_series.abs().sum()
            initial_capital = total_flow * 0.1 if total_flow > 0 else 1000
            returns = pnl_series / initial_capital

            # 使用 QuantStats
            metrics = {}
            try:
                # 只有當數據點足夠多時才算夏普率
                if len(returns) > 5:
                    metrics = {
                        "sharpe_ratio": qs.stats.sharpe(returns),
                        "win_rate": qs.stats.win_rate(returns),
                        "max_drawdown": qs.stats.max_drawdown(returns),
                        "profit_factor": qs.stats.profit_factor(returns),
                        "total_trades": len(df),
                        "total_pnl_value": pnl_series.sum()
                    }
                else:
                    metrics = {"total_trades": len(df), "note": "數據過少"}
            except:
                metrics = {"error": "QuantStats 計算異常", "total_trades": len(df)}

            # 轉為 Python 原生類型 (JSON Friendly)
            return {k: float(v) if isinstance(v, (np.float64, np.float32)) else v for k, v in metrics.items()}

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"分析崩潰: {str(e)}"}