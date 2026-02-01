SPOONOS Tools Directory
=======================

This folder contains tool implementations and the toolkit registry that the
main agent uses.

当前可用工具与 Toolkit
--------------------
以下清单来自 `toolkits.py`，按 Toolkit 归类；若相关依赖未安装，工具会为空列表。

Toolkit: `web`
- `WebScraperTool`: 网页抓取/解析工具（来自 `spoon_toolkits.web`，未安装则不可用）。

Toolkit: `neo`
- `GetBlockCountTool`: 获取 Neo 链最新区块高度。
- `GetBestBlockHashTool`: 获取 Neo 链当前最佳区块哈希。
- `GetRecentBlocksInfoTool`: 获取最近若干区块的概要信息。

Toolkit: `crypto`
- `get_market_data`: 基于 CoinGecko 获取币种价格、走势、技术指标与回撤。
- `get_social_sentiment`: 获取恐惧贪婪指数 + Twitter 情绪分析（Rettiwt + alternative.me）。
- `get_ecosystem_overview`: 获取链/协议 TVL、排名与趋势（DefiLlama）。
- `get_target_analysis`: 计算持仓 PnL、目标价位、R:R 与退出/减仓建议。
- `get_volatility_metrics`: 计算波动率、最大回撤、Sharpe 与对 BTC 的 Beta（Binance/CoinGecko）。
- `get_technical_analysis`: 计算 MA/EMA、RSI、MACD、布林带、支撑阻力与资金流（Binance）。

Toolkit: `profile`
- `mbti_profile_create`: 生成并保存 MBTI 量化交易者画像，返回 `profile_id` 与结构化结果。
- `mbti_trader_questionnaire`: 生成问卷当前题目（结构化题目与进度）。
- `mbti_trader_questionnaire_next`: 记录上一题答案并返回下一题或完成状态。

Toolkit: `test`
- `test_echo`: 回显输入文本（基础连通性测试）。
- `test_json_render`: 拼装简单 JSON（UI 渲染测试）。
- `test_delay`: 延迟指定秒数后返回（时延测试）。
- `test_error`: 主动抛错（错误分支测试）。

How to extend Tools
-------------------
1) Add a new tool implementation
   - Create a new module in this folder (for example, `my_tool.py`).
   - Implement a tool class compatible with the Spoon AI tool interface.

2) Register the tool in a toolkit
   - Open `toolkits.py` and add your tool to `TOOLKIT_REGISTRY`.
   - Toolkits are small groups of tools, keyed by name (for example, `web`,
     `profile`, `test`).

How to register with the main agent
-----------------------------------
- The main agent loads tools in `react_agent.create_react_agent()` by calling:
  - `resolve_toolkits()` to decide which toolkit names to load.
  - `load_toolkits()` to instantiate tools from `TOOLKIT_REGISTRY`.
- To make your tool available:
  - Add it to a toolkit in `toolkits.py`.
  - Add the toolkit name to the request’s `toolkits` list, or update the
    defaults in `core/config.py` (`ToolkitConfig.default_toolkits`).

Tips
----
- Keep tools small and single-purpose.
- If the tool emits tool-call events, ensure it works with
  `tool_call_wrapper.wrap_tools_for_calls()` to surface outputs in the UI.
