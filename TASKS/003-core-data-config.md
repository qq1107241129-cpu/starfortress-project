# TASKS/003-core-data-config

## 1. 任务目标

建立核心数据配置系统，为塔、敌人、关卡、建筑、技能、星核重构和经济数值提供可扩展配置。

## 2. 背景说明

MVP 需要 10 关、4 种塔、5 种敌人、5 个建筑、2 个主动技能、若干肉鸽强化和 5 个永久技能。数值不得散落硬编码在业务逻辑中。

## 3. 涉及文件

- `assets/scripts/data/TowerConfig.ts`
- `assets/scripts/data/EnemyConfig.ts`
- `assets/scripts/data/StageConfig.ts`
- `assets/scripts/data/BuildingConfig.ts`
- `assets/scripts/data/SkillConfig.ts`
- `assets/scripts/data/RebirthConfig.ts`
- `assets/scripts/data/EconomyConfig.ts`
- `assets/scripts/core/ConfigManager.ts`
- `docs/TECH_DESIGN.md`
- `docs/GAME_DESIGN.md`
- `PROJECT_MEMORY.md`
- `CHANGELOG.md`

## 4. 允许修改范围

- 新增或更新数据配置文件。
- 新增 `ConfigManager`。
- 补充 MVP 初始配置数据。
- 更新相关文档和变更记录。

## 5. 禁止修改范围

- 不实现战斗逻辑。
- 不实现 UI。
- 不实现存档读写。
- 不接平台 API。
- 不增加超出 MVP 数量的塔、敌人、建筑或关卡。

## 6. 实现假设

- 配置可先使用 TypeScript 常量或对象数组。
- 后续可迁移为 JSON、表格或远程配置。
- 本任务只建立读取能力，不要求完整数值平衡。

## 7. 实现步骤

1. 定义塔配置结构，包含 id、名称、攻击、射速、范围、类型、升级参数。
2. 定义敌人配置结构，包含 id、名称、生命、速度、护甲、奖励、特殊标记。
3. 定义关卡配置结构，包含关卡 id、时长、波次、Boss 时间和奖励。
4. 定义建筑配置结构，包含 id、名称、产出、升级成本、效果。
5. 定义技能配置结构，包含主动技能和局内强化。
6. 定义星核重构配置，包含条件、星核碎片计算参数、永久技能。
7. 定义经济配置，包含在线收益、离线收益倍率和离线上限。
8. 创建 `ConfigManager`，统一暴露读取方法。
9. 更新文档和变更记录。

## 8. 验收标准

1. 配置可被代码读取。
2. 不把核心数值硬编码到业务逻辑。
3. 关卡、塔、敌人、建筑都可通过配置扩展。
4. MVP 数据完整。
5. TypeScript 编译无错误。

## 9. 测试方式

- 在 Web 预览或临时调试入口读取配置，确认能取到 10 关、4 种塔、5 种敌人、5 个建筑。
- 检查 `ConfigManager` 对不存在 id 的处理。
- 搜索业务逻辑中是否出现大量散落数值。

## 10. 回滚方式

- 删除新增配置文件和 `ConfigManager`。
- 恢复文档与 changelog。
- 确认没有业务代码依赖残留。

## 11. 给执行 Agent 的执行提示词

你是《星垒计划》的执行工程师。当前任务是建立核心数据配置系统。请只创建配置与读取管理，不要实现战斗、UI、存档或平台功能。

所有 MVP 数值先以配置形式集中保存。完成后验证配置可读取、TypeScript 无错误，并更新 `CHANGELOG.md` 与必要文档。

