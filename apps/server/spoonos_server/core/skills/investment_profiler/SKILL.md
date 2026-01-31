# Investment Profiler

## Description
This skill analyzes user transaction history (CSV/Excel) and psychological questionnaire results to generate a personalized MBTI investment personality profile. It combines quantitative metrics (Sharpe ratio, Win rate) with qualitative traits (MBTI dimensions) to provide deep insights.

## Tools
- `generate_investment_quiz`: Generates a randomized set of 8 questions to assess the user's investment psychology (MBTI dimensions).
- `analyze_user_profile`: Takes a transaction file path and user's questionnaire answers, processes them, and returns a comprehensive dual-analysis report (Behavioral vs. Self-Reported).