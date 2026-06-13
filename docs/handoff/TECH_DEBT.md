# 技术债登记

本文档记录全项目审查中发现的技术债，后续按独立 TASKS 逐步修复。

---

## 2026-06-11：001～013 全项目阶段审查技术债

### 背景

013.3 防御塔攻击弹道任务完成后，对 001～013 做了一次只读全项目审查。本章节记录审查中发现但暂不立即修复的问题，后续按 014 系列任务逐步处理。

### 总体结论

- P0：暂无确定阻塞
- P1：暂无已确认代码级高危缺陷；013.3 攻击弹道已由用户人工 Web 预览验收通过；平台真机仍未验证
- P2：存在任务文档、交接状态、永久技能、坐标体系、事件常量等中优先级技术债
- P3：存在历史命名、旧 API、未验证状态归档等低优先级问题

### P2 技术债

| 编号 | 问题 | 影响 | 建议任务 | 状态 |
|---|---|---|---|---|
| TD-013-B-P2-001 | TASKS/013.1-UILayer改动.md 是 0 字节空文件，历史任务不可审计 | 任务追溯困难，无法确认 013.1 的允许/禁止范围和验收标准 | TASKS/014.1-task-doc-and-current-state-consistency.md | 待处理 |
| TD-013-B-P2-002 | docs/handoff/CURRENT_STATE.md 同时出现当前分支和旧分支/旧工作区描述，交接状态不一致 | 新会话接手时可能误判当前状态 | TASKS/014.1-task-doc-and-current-state-consistency.md | 待处理 |
| TD-013-B-P2-003 | 星核重构的部分永久技能仍未接入实际系统：perm_attack、perm_orbital、perm_rogue_quality | 转生后这些技能无实际效果，玩家体验不完整 | TASKS/014.2-rebirth-permanent-skill-integration.md | 待处理 |
| TD-013-B-P2-004 | BaseManager 仍有 totalPower: 0 // TODO，转生碎片里的战力权重暂未真实接入 | 星核碎片计算中战力权重始终为 0，转生奖励偏少 | TASKS/014.2-rebirth-permanent-skill-integration.md | 待处理 |
| TD-013-B-P2-005 | SkillManager 仍有 { x: 540, y: 360 } 默认坐标，和 013.2 后的 BattleVisualRoot 本地坐标体系不完全一致 | 当前空敌人分支一般不会命中，但后续应清理避免坐标体系混乱 | TASKS/014.3-battle-coordinate-and-event-cleanup.md | 待处理 |
| TD-013-B-P2-006 | SHOW_TOWER_SELECT 是裸字符串事件，未集中进 BATTLE_EVENTS | 维护和审查追踪性偏弱，事件散落不易管理 | TASKS/014.3-battle-coordinate-and-event-cleanup.md | 待处理 |

### P3 技术债

| 编号 | 问题 | 影响 | 建议任务 | 状态 |
|---|---|---|---|---|
| TD-013-B-P3-001 | 旧命名 tower_machinegun / tower_cannon / tower_ice / tower_electric 仍出现在美术命名规范和历史任务/变更记录中 | 不影响代码运行，但可能造成新人误解 | 无需专门任务，代码配置 id / towerType / configId 已统一为 machinegun_tower / cannon_tower / ice_tower / electric_tower | 已记录 |
| TD-013-B-P3-002 | ConfigManager 仍暴露旧经济计算包装方法 | API 语义偏旧，有兼容实现但后续可整理 | TASKS/014.4-config-manager-api-cleanup.md | 待处理 |
| TD-013-B-P3-003 | 多处文档仍标注 Web 预览/真机未验证 | 诚实状态不是错误，但后续集中验收后应统一更新文档状态 | TASKS/014-web-preview-acceptance-and-scene-binding-audit.md | 待处理 |

### 后续建议任务

1. TASKS/014-web-preview-acceptance-and-scene-binding-audit.md — Web 预览验收与场景绑定审查
2. TASKS/014.1-task-doc-and-current-state-consistency.md — 任务文档与交接状态一致性修复
3. TASKS/014.2-rebirth-permanent-skill-integration.md — 永久技能接入与战力计算修复
4. TASKS/014.3-battle-coordinate-and-event-cleanup.md — 战斗坐标体系与事件常量清理
5. TASKS/014.4-config-manager-api-cleanup.md — ConfigManager 旧 API 整理

---

## 使用说明

- 每条技术债有唯一编号（TD-{阶段}-P{优先级}-{序号}）
- 状态字段：待处理 / 处理中 / 已修复 / 已取消
- 修复后在对应行更新状态并注明修复的 TASKS 编号
- 新增技术债时追加到对应章节，不要删除历史记录
