---
name: reverse-requirements
description: 从代码仓库中回溯业务需求、规则和重构地图
---

当用户要求“分析代码功能”“从源码整理需求”“为重构梳理业务规则”时：

1. 先调用 `repo_inventory` 建立结构地图
2. 再调用 `trace_api_flows` 追踪入口和链路
3. 调用 `trace_domain_rules` 提取状态/金额/角色/幂等/重试规则
4. 调用 `synthesize_requirements` 输出需求清单
5. 如需架构治理产物，调用 `export_refactor_map`
6. 仓库更新后调用 `rebuild_index` 执行 full/incremental 更新

输出时必须分为：
- 已证实需求（fact）
- 高概率推断需求（inference）
- 待确认问题（needs_review）

每条需求必须附带证据引用，不得编造未出现的业务流程。
