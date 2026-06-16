# Starfortress Project 当前交接状态

## 2026-06-15 019 战斗暂停弹窗

- 状态：代码已完成，Web 预览待用户确认
- 新增 `BattlePausePanel.ts`：战斗暂停弹窗组件
  - 半透明遮罩 + 居中面板 + 青色描边
  - 三个按钮：继续游戏、重打本关、返回主菜单
  - 支持 lazy init
- 修改 `BattleUI.ts`：
  - 新增 `battlePausePanel` 属性（用户绑定）
  - `_onPause()` 暂停后显示弹窗
  - 继续游戏：恢复战斗
  - 重打本关：复用当前 stageId，倍速重置为 1x
  - 返回主菜单：GameManager.returnToMain()，不触发结算
- 暂停逻辑：复用 BattleManager.pauseBattle()，和肉鸽暂停独立
- `.scene` 状态：未修改
- `.meta` 状态：`BattlePausePanel.ts.meta` 需要用户用 Cocos Creator 打开项目自动生成
- 代码已实现，Web 预览待用户确认

**Cocos 人工绑定清单**：
1. 在 BattleUIRoot 下创建空节点 BattlePausePanelRoot
2. 设置 BattlePausePanelRoot 默认 active=false
3. 将 BattlePausePanel.ts 挂载到 BattlePausePanelRoot
4. 在 BattleUI 组件中绑定 battlePausePanel（指向 BattlePausePanelRoot）
5. 确认 pauseButton 已绑定（如果还没有）
6. 保存 Battle.scene
7. 用 Cocos Creator 打开项目自动生成 BattlePausePanel.ts.meta

---

## 2026-06-15 018 倍速 UI 重置同步修复

- 状态：代码已完成，Web 预览待用户确认
- 修复开完 4 倍速后重新开始游戏时，UI 仍显示 4 倍速但实际逻辑已是 1 倍速的问题：
  - `BattleManager.startBattle()` 中重置 `_battleSpeed = 1` 后发射 `BATTLE_SPEED_CHANGE` 事件
  - `BattleManager.returnToIdle()` 中重置 `_battleSpeed = 1` 后发射 `BATTLE_SPEED_CHANGE` 事件
- `.scene` 状态：未修改
- `.meta` 状态：无新增脚本
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 017 分裂无人机死亡分裂逻辑

- 状态：代码已完成，Web 预览待用户确认
- 实现分裂无人机死亡后分裂生成小单位：
  - `EnemyController._die()` 发射 `ENEMY_SPLIT` 事件
  - `EnemySpawner.spawnEnemyAtPosition()` 从指定位置生成敌人
  - 子单位继承父单位路径目标点，从死亡位置继续移动
  - `BattleManager` 监听分裂事件，生成子单位
- 分裂触发时机：只在 `_die()` 中（被攻击击杀），`_reachBase()` 不触发
- 子单位路径：继承父单位目标点，从死亡位置到基地边缘
- 防止无限分裂：子单位是 `enemy_mech_bug`，无 split 配置
- `.scene` 状态：未修改
- `.meta` 状态：无新增脚本
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 016.2.3 关卡选择面板默认滚动定位修复（顶部空白）

- 状态：代码已完成，Web 预览待用户确认
- 修复打开面板后标题下方出现大块空白的问题：
  - 改用"可见窗口 startIndex 算法"
  - startIndex = max(0, recommendedIndex - visibleCount + 1)
  - targetScrollY = startIndex * itemStride
  - 使用 `scrollToOffset` 替代直接设置 content.position
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 已存在
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 016.2.2 关卡选择面板默认滚动位置修复

- 状态：代码已完成，Web 预览待用户确认
- 修复打开面板后默认显示第 1～6 关，没有滚动到推荐关卡的问题：
  - 改用 `scheduleOnce` 延迟一帧执行滚动
  - 直接设置 `content.position.y`，更可靠
  - 推荐关卡出现在可视区域底部附近
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 已存在
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 016.2.1 关卡选择面板 ScrollView 顶部裁剪修复

- 状态：代码已完成，Web 预览待用户确认
- 修复第 1 关顶部被 Mask 裁剪的问题：
  - Content 添加顶部/底部 padding（32px）
  - 第一个按钮从 padding 下方开始排列
  - 滚动偏移计算加入 padding 补偿
  - ScrollView 与标题/返回按钮间距调整
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 已存在
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 016.2 关卡选择面板滚动列表与布局修复

- 状态：代码已完成，Web 预览待用户确认
- 重写 `StageSelectPanel.ts` 布局，实现可滚动关卡列表：
  - 返回按钮固定底部 y=-420
  - 标题固定顶部 y=420
  - 中间区域 ScrollView + Mask + Content 可滚动结构
  - 显示所有 StageConfig 关卡（不再限制 6 关）
  - 打开时默认滚动到推荐关卡（highestStage 对应位置）
  - 移除"更多关卡后续开放"提示
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 已存在（016 时创建）
- 代码已实现，Web 预览待用户确认

**Cocos 人工操作说明**：
- 整体面板位置不满意时，用户只移动 StageSelectPanelRoot
- 执行 Agent 不修改 .scene
- 如果 Battle.scene 出现变更，默认视为用户人工 Cocos Creator 操作

---

## 2026-06-15 016.1 关卡选择面板布局优化

- 状态：代码已完成，Web 预览待用户确认
- 重写 `StageSelectPanel.ts` 布局逻辑：
  - 容器固定尺寸 560 x 980，布局不再依赖外部节点尺寸
  - 标题 y=420，返回按钮 y=360，关卡列表从 y=260 开始
  - 关卡按钮内部文字分层：标题 y+24、描述 y-4、状态 y-28
  - 已解锁按钮：青色描边，白色文字，"点击挑战"
  - 未解锁按钮：灰色描边，灰色文字，"🔒 未解锁"
  - 最多显示前 6 关，超过时底部显示"更多关卡后续开放"
  - 添加调试日志：open、refresh stage count、click stage
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 需要用户用 Cocos Creator 打开项目确认
- 代码已实现，Web 预览待用户确认

---

## 2026-06-15 016 关卡选择动态面板（含 lazy init 修复）

- 状态：代码已完成，Web 预览待用户确认
- 新增 `assets/scripts/ui/StageSelectPanel.ts`：关卡选择面板组件
  - 动态生成关卡列表 UI（Graphics + Label，不引入图片资源）
  - 读取 StageConfig 自动生成关卡按钮
  - 读取 SaveManager.highestStage 判断解锁状态
  - 已解锁关卡可点击进入战斗，未解锁关卡显示锁定状态
  - 提供 open() / close() / refresh() 方法
  - **支持 lazy init**：即使节点初始 active=false，也能在第一次 open() 时正常初始化
- **修复**：点击"开始游戏"需要点两次才出现关卡选择面板的问题
  - 根因：节点 active=false 时 onLoad() 不执行，Manager 引用未初始化
  - 修复：open() 中先激活节点，再调用 _ensureInitialized() 确保初始化
  - _ensureInitialized() 幂等，只执行一次
  - MainUI 不再兜底 enterBattle，找不到 StageSelectPanel 时只 console.error
- 修改 `MainUI.ts`："开始游戏"按钮改为打开关卡选择面板
- 修改 `SaveManager.ts`：新增 updateHighestStage() 方法
- 修改 `GameBootstrap.ts`：胜利时更新 highestStage
- 修改 `SettlementUI.ts`："继续"按钮改为返回主界面（保守处理）
- 不新增 stageSelect 状态，避免影响 MainUIRoot 显隐
- `.scene` 状态：未修改
- `.meta` 状态：`StageSelectPanel.ts.meta` 需要用户用 Cocos Creator 打开项目自动生成
- 代码已实现，Web 预览待用户确认

**Cocos 人工操作清单**：
1. 在 MainUIRoot 下新建空节点 StageSelectPanelRoot
2. 设置 StageSelectPanelRoot 默认 active=false
3. 将 StageSelectPanel.ts 挂载到 StageSelectPanelRoot
4. 在 MainUI.ts 中绑定 stageSelectPanel 属性（可选）
5. 调整 StageSelectPanelRoot 的位置、大小、锚点
6. 保存场景

---

## 2026-06-15 015 系列审查修复

- 状态：代码修复完成，Web 预览待用户确认
- 修复 015.5 UI 样式接入的 TypeScript 类型错误：
  - `styleLabel()` 调用改为传入 `Label.node`
  - `Button.target` 改为设置 `Sprite.node`
- 补建缺失的 `TASKS/015.5.2-ui-visual-polish-detail-fix.md`
- 同步 015.5.3 文档：真实目标为复用肉鸽 `styleOuterFrame` 大面板逻辑，不再做 modal backdrop / TowerModalBackdrop / Shader / Material / RenderTexture
- 同步 015.1 / `PROJECT_MEMORY.md`：冻结特效为雪花扩散，技能 VFX 生命周期由 `update(deltaTime)` 驱动
- `assets/scenes/Battle.scene` 为用户人工 Cocos 绑定 / UI 调整改动，本轮只报告，不修改、恢复、checkout、stash、格式化或脚本处理
- `RebirthManager.ts` 的 `baseCoreLevel` TypeScript 问题不属于 015 系列，本轮不修；整体 `tsc` 仍会被该既有非 015 问题阻断

---

## 2026-06-14 015.5.3 塔详情和塔位选择界面复用肉鸽大面板逻辑

- 状态：代码已完成，Web 预览待用户确认
- 放弃单独遮罩节点方案，复用肉鸽 `styleOuterFrame` 大面板逻辑
- 塔详情/塔位选择改为深色半透明大底板
- 用户在 Cocos 里负责调整面板 UITransform 尺寸
- `.scene` 状态：`assets/scenes/Battle.scene` 为用户人工 Cocos 绑定 / UI 调整改动
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.5.2 UI 美化第二轮细节修复（绑定优先 + 动态 fallback + 肉鸽外框）
- 肉鸽选择面板：应用 styleOuterFrame 绘制外层大框
- 外框风格：深色半透明背景、青色/蓝紫色描边、轻微科幻 UI 质感
- 外框不遮挡文字和按钮，不影响三个选项点击
- 塔位选择面板：绑定优先 + 动态 fallback
- 塔详情面板：新增绑定属性，绑定优先 + 动态 fallback
- `.scene` 状态：未修改
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.5.2 UI 美化第二轮细节修复（绑定优先 + 动态 fallback）
- 肉鸽选择面板：应用 stylePanel、styleCard、stylePanelTitle
- 塔位选择面板：绑定优先 + 动态 fallback
- 塔详情面板：新增绑定属性，绑定优先 + 动态 fallback
- `.scene` 状态：未修改
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.5.2 UI 美化第二轮细节修复
- `UITheme.ts`：新增 ghost 按钮颜色、value/warning 文字颜色
- `UIStyleUtil.ts`：新增 ghost variant、stylePanelTitle、styleValueLabel、styleWarningLabel
- `BattleUI.ts`：动态面板应用统一样式
- `.scene` 状态：未修改
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.5.1 UI 样式未生效修复
- 修复 UI 美化后按钮和面板几乎没变化的问题
- 增强 styleButton 方法，按优先级查找 Sprite
- 设置 Button transition colors
- Graphics fallback 创建 UIStyleBg 子节点作为背景
- `.scene` 状态：未修改
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.5 UI 美化第一轮
- 新增 `UITheme.ts` 和 `UIStyleUtil.ts`，统一颜色、字号、按钮样式
- `MainUI.ts`、`BattleUI.ts`、`SettlementUI.ts` 应用统一样式
- `.meta` 状态：`UITheme.ts.meta` 和 `UIStyleUtil.ts.meta` 已创建
- `.scene` 状态：未修改
- 未修改战斗/数值/技能逻辑
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.4 塔升级属性生效 + 塔详情面板
- 修复战斗内放塔读取存档塔等级，使局外升级生效
- 新增 `TowerController.getEffectiveStats()` 方法，返回当前实际生效属性
- 新增塔详情面板，点击已放置塔显示属性
- `.scene` 状态：未修改
- 未修改 TowerConfig 基础数值
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.3 Boss 击杀胜利 + Boss 进基地结算
- 修改战斗胜利条件：不再因为 180 秒时间到达自动胜利，改为 Boss 被击杀后才胜利结算
- `TimeManager.ts`：删除时间到自动 emit `BATTLE_RESULT: victory` 的逻辑
- `BattleManager.ts`：在 `ENEMY_DEATH` 监听中增加 Boss 死亡胜利判断
- `BattleManager.ts`：在 `ENEMY_REACH_BASE` 监听中增加 Boss 进基地结算逻辑
- `EnemyConfig.ts`：接口和配置新增 `baseDamage` 字段
- `EnemyController.ts`：状态保存 `baseDamage`，`_reachBase()` 传递 `configId`、`isBoss`
- `.scene` 状态：未修改
- 未修改 TowerConfig、BattleBalanceConfig、StageConfig
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 015.2 冰塔减速特效残留修复

- 状态：代码已完成，Web 预览待用户确认
- 问题：冰塔减速特效在敌人死亡时有概率残留原地不消失
- 修复：`BattleVisualManager._syncSlowEffectPositions()` 增加兜底清理逻辑
  - 每帧遍历 `_slowEffects` Map
  - 如果 enemyId 不在存活敌人列表中，立即清理对应特效
  - 如果 slowNode 无效，也从 `_slowEffects` 删除
- `.scene` 状态：未修改
- 未修改冰塔减速倍率、减速时间、伤害、攻击逻辑
- 未修改 `EnemyController.ts`（本轮只在视觉层兜底）
- 代码已实现，Web 预览待用户确认
- 如果本轮修复后仍复现残留，再开第二轮排查 `EnemyController._die()` 是否需要重置 `slowRemaining` / `slowFactor`

---

## 2026-06-14 015.1 active skill VFX redo

- Status: code redo completed; Cocos manual mount and Web preview visual acceptance are still user-side checks.
- Changed `assets/scripts/battle/SkillEffectView.ts` only for skill visuals: no skill logic, damage, freeze duration, charges, targeting, enemy movement, platform API, images, or dependencies were changed.
- Orbital cannon VFX is now staged: lock-on rings/crosshair, descending high-energy beam, impact flash, shockwave rings, residual glow, and outward sparks.
- Freeze VFX is now staged: an expanding snowflake burst, light battlefield ice cover, diagonal frost bands, sparse cracks, and crystal flakes that fade out.
- Effect sizing now reads `UITransform` from the mounted layer or parent first; `1080x1920` is fallback only.
- Effect lifetime now uses `update(deltaTime)` with an active effect list. `BATTLE_END` and `onDestroy` destroy all active skill effect nodes.
- `.scene` status: `assets/scenes/Battle.scene` was already modified before this redo and remains treated as user manual Cocos work. Codex did not modify, recover, checkout, stash, format, or script-process it.
- `.meta` status: `assets/scripts/battle/SkillEffectView.ts.meta` already exists and was left untouched by this redo.

Manual Cocos check:
1. Open Cocos Creator.
2. Open the Battle scene.
3. Select `BattleVisualRoot -> EffectLayer`.
4. Confirm `SkillEffectView` is mounted on `EffectLayer`.
5. Save only through Cocos Creator if a scene binding change is needed.

Web preview check:
1. Run Web Preview from Cocos Creator.
2. Enter battle and place towers.
3. Use orbital cannon and confirm lock-on, beam, and impact burst are readable.
4. Use freeze and confirm the snowflake burst, blue cover, cracks, and flakes are readable.
5. Switch x1/x2/x3/x4 and confirm VFX remains readable.
6. End battle and confirm no skill effect nodes remain and the console has no errors.

生成时间：2026-06-14

本文件基于当前仓库读取结果整理，用于新会话接手。未重新启动 Cocos Creator，也未重新运行 Web 预览；无法确认的内容均标注为"不确定，需要人工确认"。

## 2026-06-14 015.1 主动技能视觉特效

- 状态：代码已完成，需人工在 Cocos Creator 中挂载组件，Web 预览待用户确认
- 新增 `assets/scripts/battle/SkillEffectView.ts`：技能视觉特效管理器
- 轨道炮特效：预警圆环 + 能量光柱 + 命中爆炸圆环，持续 0.6 秒
- 全屏冻结特效：冰蓝覆盖 + 雪花扩散 + 冰晶裂纹/短线，持续约 1.17 秒
- 使用 Graphics 动态绘制，不引入新图片资源
- `.meta` 状态：`SkillEffectView.ts.meta` 已存在，本轮不主动重写
- `.scene` 状态：`assets/scenes/Battle.scene` 为用户人工 Cocos 绑定 / UI 调整改动
- 未修改技能伤害、冻结时长、充能逻辑
- 代码已实现，Web 预览待用户确认

**Cocos 人工挂载步骤**：
1. 打开 Cocos Creator 编辑器
2. 在场景中找到 `BattleVisualRoot` 节点
3. 展开 `BattleVisualRoot`，找到 `EffectLayer` 子节点
4. 选中 `EffectLayer` 节点
5. 在属性检查器中点击「添加组件」
6. 搜索并添加 `SkillEffectView` 脚本组件
7. 保存场景

---

## 2026-06-14 015 肉鸽选择面板与塔位选择面板置顶修复

- 状态：代码已完成，Web 预览待用户确认
- 问题：肉鸽选择面板和塔位选择面板被 BattleVisualRoot 盖住，按钮无法点击
- 修复：在 `BattleUI.ts` 中新增 `_bringNodeToFront()` 方法，弹出面板时调用 `setSiblingIndex` 置顶
- 影响范围：
  - `_showRogueChoicePanel()`：肉鸽选择面板置顶
  - `_showTowerSelectPanel()`：塔位选择面板置顶（场景绑定版本）
  - `_showDynamicTowerSelectPanel()`：动态创建的塔位选择面板置顶
- `.meta` 状态：无新增脚本，无需创建 `.meta`
- `.scene` 状态：未修改，检测到的 `.scene` 差异默认视为用户人工改动
- 未修改战斗数值
- 未引入新依赖
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 Codex 审查修复 014 / 014.1 / 014.2

- 状态：已完成最小修复，Web 预览待用户确认
- 修复 `AttackEffectView.ts` 重复 `onDestroy()`，确保倍速事件解绑和 Graphics 清理同时执行
- 修复 `ProjectileManager.ts` 电塔链式攻击 `99999` 魔法速度；链式攻击保持瞬发结算，速度字段恢复为 `BATTLE_BALANCE` 配置表达式
- 修复 014 系列相关 TypeScript 兼容性问题：移除 `Array.includes()` / `String.padStart()` / `Camera.main` 用法
- 恢复越权数值改动：
  - `EnemyConfig.ts` 普通机械虫生命值恢复为 25
  - `StageConfig.ts` 第 1 关波次恢复为原配置
  - `TowerConfig.ts` 炮塔 `splashRadius` 恢复为 60
- 恢复越权项目设置改动：`settings/v2/packages/project.json` 恢复为仅保留 `__version__`
- `.meta` 状态：`BattleBalanceConfig.ts.meta` 已存在
- `.scene` 状态：检测到 `assets/scenes/Battle.scene` 相对 `origin/develop` 有变更，默认视为用户人工 Cocos Creator 改动；本轮 Codex 未修改、未恢复、未 checkout、未 stash
- 代码已实现，Web 预览待用户确认

---

## 2026-06-14 014.2 战斗反馈修复（后续补丁）

- 状态：代码已提交，已做 Codex 最小修复，待 Web 预览验证
- 投射物视觉与逻辑统一：视觉炮弹跟随 ProjectileManager 投射物位置
- 炮塔爆炸在命中同一帧触发，第一帧立即可见（橙红色爆点）
- 减速特效已实现：冰蓝色光环+冰晶，跟随敌人移动
- 减速结束或敌人死亡时自动清理特效
- 修复 BattleVisualManager.ts 语法错误（第 582 行孤立代码）
- Codex 后续修复：合并 AttackEffectView.ts 重复 onDestroy，避免事件解绑残留
- 未修改战斗数值、攻击逻辑、弹射规则
- 检测到 `assets/scenes/Battle.scene` 相对 `origin/develop` 有变更，默认视为用户人工 Cocos Creator 改动；本轮 Codex 未修改
- 代码已实现，Web 预览未验证，需要人工确认

---

## 2026-06-13 014.2 电弧弹射特效修复与伤害飘字

- 状态：代码已提交，待 Web 预览验证
- 电弧弹射特效已修复：ProjectileManager._chainAttack() 发出 CHAIN_HIT 事件，BattleVisualManager 为每段弹射创建电弧
- 伤害飘字已实现：ProjectileManager 每次 takeDamage 后发出 DAMAGE_NUMBER_SHOW 事件，BattleVisualManager 创建飘字
- EnemyController.takeDamage() 已返回实际扣血值
- 飘字使用真实 deltaTime，不跟随倍速，确保 x4 下可读
- 电弧特效跟随现有 AttackEffectView 倍速机制
- 未修改战斗数值、攻击逻辑、弹射规则
- 未修改 `.scene`
- 代码已实现，Web 预览未验证，需要人工确认

---

## 2026-06-13 014.1 战斗倍速控制

- 状态：代码已提交，待 Web 预览验证
- 新增战斗倍速控制，支持 1x/2x/3x/4x 循环切换
- `BattleManager` 维护 `_battleSpeed`，`update()` 使用 `scaledDeltaTime`
- `BattleUI` 场景绑定倍速按钮（speedButton / speedButtonLabel）
- `AttackEffectView` 已接入倍速，特效跟随战斗速度
- 倍速不影响主界面、放置阶段、肉鸽暂停
- 新战斗默认回到 1x
- 未修改 `.scene`
- 代码已实现，Web 预览未验证，需要人工确认

---

## 2026-06-13 014 战斗数值配置化基线

- 状态：代码已提交，待 Web 预览验证
- 新增 `BattleBalanceConfig.ts`，集中 20+ 个硬编码平衡常量
- 6 个战斗代码文件已改为从配置读取
- 默认值与原硬编码值完全一致，行为不变
- 未修改战斗数值
- 未修改 `.scene`
- 代码已实现，Web 预览未验证，需要人工确认
- 未修改 `.scene`
- 代码已实现，Web 预览未验证，需要人工确认

---

## 2026-06-13 014 战斗平衡配置化基线

- 状态：代码已完成，待 Web 预览验证
- 新增 `BattleBalanceConfig.ts`，集中 20+ 个硬编码平衡常量
- 6 个战斗代码文件已改为从配置读取
- 默认值与原硬编码值完全一致，行为不变
- SkillManager 默认坐标 `{ x: 540, y: 360 }` 保持不变
- `BattleBalanceConfig.ts.meta` 已存在
- 未修改 `.scene`
- 未做数值调优，调优放到 TASKS/015

---

## 2026-06-11 001～013 全项目阶段审查技术债归档

- 001～013 全项目阶段审查结果已归档到 `docs/handoff/TECH_DEBT.md`
- P2 技术债 6 项、P3 技术债 3 项已记录
- 后续按 014 系列任务逐步处理
- 仅文档归档，未修改代码

---

## 2026-06-11 013.3 攻击弹道状态更新

- 当前分支：`fix/防御塔攻击弹道`
- 013.3 攻击弹道状态：代码已实现，用户已人工 Web 预览验证通过
- `AttackEffectView` 已新增 4 种塔的专属攻击效果和 `playTowerAttackEffect()` 统一入口
- `BattleVisualManager._createAttackEffect()` 已改为按 `towerType` 播放专属效果
- 4 种效果：
  - `machinegun_tower`：快速小子弹 / 短拖尾
  - `cannon_tower`：炮弹飞行 / 命中爆炸
  - `ice_tower`：冰锥 / 冰冻扩散
  - `electric_tower`：折线闪电
- 未修改 `.scene`
- 未修改战斗数值、攻击频率、目标选择逻辑、敌人移动逻辑或塔配置数值
- 代码已实现，用户已人工 Web 预览验证通过
- 人工验收确认：可进入战斗，基地和塔位显示正常，可点击塔位并放置防御塔，4 种塔都能攻击，攻击弹道已从统一线条改为不同效果，未发现阻塞问题。

---

## 1. 项目基本信息

- 项目中文名：《星垒计划》
- 项目英文名：Starfortress Project
- 仓库名：starfortress-project
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 当前 `package.json` 标记 Creator 版本：3.8.8
- 屏幕方向：竖屏
- 当前目标平台：
  - Web 预览
  - 微信小游戏
  - 抖音小游戏
  - TapTap 小游戏
- 第二阶段可选平台：
  - TapTap Android APK
  - Android / iOS 原生包
- 当前阶段：MVP 开发

### 012 完成状态

- 012 已完成的是平台构建链路配置
- 012 不代表小游戏提审质量达标
- 012 不代表 Web demo 已经可玩
- 012 不代表当前版本已经达到可玩或提审质量

### 可视化战斗状态

- 011.5-battle-visual-demo 已完成
- 战斗可视化层已实现（BattleVisualManager、EnemyView、TowerView、AttackEffectView）
- 是否可玩需要人工在 Web 预览中确认

### 013.1 UILayer 改动状态

- 013.1-UILayer改动 任务1 已完成
- UILayerController 已创建并挂载到 UILayer 节点
- BattleVisualManager 已添加 GameManager 状态监听
- UILayer 默认隐藏，战斗状态时显示，非战斗状态时隐藏
- BattleVisualRoot 默认隐藏，战斗状态时显示

### 013.2 战斗布局重新设计状态

- 013.2-battle-layout-redesign 已实现
- **坐标系已修正**：从横屏(1920×1080)改为 BattleVisualRoot 本地坐标系
- 基地 100×100 正方形居中 (0, 0)（本地坐标原点）
- 8 个塔位围绕基地，距离 110 像素
- 战斗区域：半宽 420，半高 650（竖屏纵向更大）
- 敌人从随机方向进攻
- 战斗开始后暂停，玩家放置 4 个塔后自动恢复
- 小怪白色，Boss 红色
- 不同敌人类型有不同像素形状
- 修复了 StageManager 重复 getPath() 方法 bug
- **修复了塔位放置流程**：
  - 移除 GameBootstrap 自动放置测试塔（此前 slot_1~slot_4 被自动占据）
  - BATTLE_START 不再重复发出（_resumeFromPlacement 改用 BATTLE_PLACEMENT_COMPLETE）
  - GameManager 先 setState('battle') 再 startBattle（节点在 BATTLE_START 前激活）
  - 塔位选择面板支持动态创建（场景未绑定时自动创建）
  - **触摸坐标换算修复**：改用 Camera.screenToWorld() 做 screen→world 转换
  - **动态面板按钮触摸修复**：改用系统级触摸 + 手动碰撞检测
  - **Web 预览鼠标点击修复**：BattleVisualManager 与 BattleUI 动态面板同时监听 MOUSE_DOWN；坐标换算优先使用 getUILocation() 的 UI 世界坐标，Canvas Camera 仅作兜底
  - **BattleUI 激活时序修复**：BattleUI 的 GameManager 状态监听前移到 onLoad，避免 onLoad 内设置 active=false 后 start 未及时执行，导致 battle 状态无法激活 UI
  - **节点级点击兜底**：动态槽位节点、动态塔选择按钮、取消按钮同时挂 TOUCH_END，配合系统级输入双路径处理

**关键判断：任务完成不等于玩法闭环完成；012 构建完成也不代表当前版本已经达到可玩或提审质量。**

---

## 2. 当前 Git 状态

- 当前分支：`feature/013-playable-battle-visual-demo`
- 工作区有未提交改动（013.1-UILayer改动）
- 已修改文件：CHANGELOG.md、CLAUDE.md、Battle.scene、BattleVisualManager.ts、CURRENT_STATE.md
- 新增文件：UILayerController.ts、UILayerController.ts.meta

```txt
git status --short --branch --untracked-files=all 结果：
## feature/013-playable-battle-visual-demo
 M CHANGELOG.md
 M CLAUDE.md
 M assets/scenes/Battle.scene
 M assets/scripts/battle/BattleVisualManager.ts
 M docs/handoff/CURRENT_STATE.md
?? TASKS/013.1-UILayer改动.md
?? assets/scripts/ui/UILayerController.ts
?? assets/scripts/ui/UILayerController.ts.meta
```

### 分支状态判断

1. 当前在 feature/013-playable-battle-visual-demo ✓
2. 有未提交改动（013.1-UILayer改动）
3. 有未跟踪文件（UILayerController.ts、UILayerController.ts.meta、TASKS/013.1-UILayer改动.md）
4. 无 staged 内容 ✓
5. 所有新增 .meta 文件存在 ✓
6. 不应提交的目录未被提交 ✓

### 结论

当前有 013.1 未提交改动，UILayerController 已挂载到 UILayer 节点（人工确认）。建议确认 Web 预览效果后提交。

---

## 3. 任务完成状态总览

| 任务编号 | 任务名 | 状态 | 审查通过 | 合入 develop | 核心产物 | 当前风险 | 人工确认 |
|---------|--------|------|---------|-------------|---------|---------|---------|
| 001 | project-init | 已完成 | ✓ | ✓ | 项目文档体系 | 无 | 不需要 |
| 002 | platform-adapter | 已完成 | ✓ | ✓ | IPlatform/Platform/4个适配器 | 无 | 不需要 |
| 003 | core-data-config | 已完成 | ✓ | ✓ | 8个Config + ConfigManager | 无 | 不需要 |
| 004 | battle-prototype | 已完成 | ✓ | ✓ | BattleManager/StageManager/TimeManager/EnemySpawner/EnemyController/BattleSettlement/EventBus | 无 | 不需要 |
| 005 | tower-system | 已完成 | ✓ | ✓ | TowerManager/TowerController/ProjectileManager | 无 | 不需要 |
| 006 | enemy-wave-system | 已完成 | ✓ | ✓ | EnemySpawner增强/BattleSettlement增强 | 无 | 不需要 |
| 006.5 | foundation-playable-integration | 已完成 | ✓ | ✓ | GameBootstrap/Battle.scene | 无 | 需要确认Web预览 |
| 007 | rogue-choice-and-skills | 已完成 | ✓ | ✓ | RogueChoiceManager/SkillManager/BattleUI | 无 | 需要确认Web预览 |
| 008 | base-building-system | 已完成 | ✓ | ✓ | SaveManager/BuildingManager/BaseManager/BuildingUI | 无 | 需要确认UI |
| 009 | idle-offline-reward | 已完成 | ✓ | ✓ | IdleIncomeManager/OfflineRewardUI | 无 | 需要确认UI |
| 010 | rebirth-system | 已完成 | ✓ | ✓ | RebirthManager/RebirthUI | 无 | 需要确认UI |
| 011 | ui-flow | 已完成 | ✓ | ✓ | GameManager/MainUI/SettlementUI/TowerUpgradeUI/SettingsUI | 无 | 需要确认UI |
| 011.5 | battle-visual-demo | 已完成 | ✓ | ✓ | BattleVisualManager/EnemyView/TowerView/AttackEffectView | 需要确认可视化效果 | 需要Web预览确认 |
| 012 | build-wechat-douyin-taptap | 已完成 | ✓ | ✓ | builder.json构建配置 | 未实机验证 | 需要工具实测 |
| 013.1 | UILayer改动 | 已完成 | - | - | UILayerController/BattleVisualManager状态监听 | 无 | 已确认挂载 |
| 013.2 | 战斗布局重新设计 | 已完成 | - | - | 基地居中/8塔位/随机敌人/像素形状 | 需要Web预览验证 | 需要确认UI |
| 013.3.1 | 统一塔类型命名 | 已完成 | - | - | machinegun_tower/cannon_tower/ice_tower/electric_tower | 需要Web预览验证 | 需要确认放置和攻击 |
| 013.3 | 攻击弹道效果 | 已完成 | - | - | 4种塔专属攻击弹道/命中特效 | 代码已实现，用户已人工 Web 预览验证通过 | 已确认可进入战斗、放塔、攻击和弹道差异 |

### 012 特别说明

- 012 完成的是平台构建链路配置
- 不代表小游戏提审质量达标
- 不代表 Web demo 已经可玩
- 可视化战斗和可玩闭环仍需单独确认

---

## 4. 当前建议新增任务

### 013-playable-battle-visual-demo

**建议状态**：建议新增

**为什么需要**：

1. 现有战斗逻辑可能已经跑通
2. 但塔、怪、子弹、攻击反馈可能没有完整画出来
3. 玩家无法只靠画面理解战斗
4. 012 已完成后仍需要补可玩 demo
5. 完成 013 后再考虑重新构建平台包或提审

**注意**：仓库已存在 011.5-battle-visual-demo 任务，可能已覆盖部分需求。需要人工确认 011.5 的可视化效果是否完整。

如果 011.5 已经完整实现可视化，则 013 可能不需要。如果 011.5 效果不完整，则需要 013 补充。

---

## 5. 当前玩法可玩性评估

| 项目 | 状态 | 说明 |
|------|------|------|
| 1. 主界面是否存在 | 已确认 | MainUIRoot 节点存在于 Battle.scene |
| 2. 开始战斗按钮是否存在 | 已确认 | MainUI.ts 有 startBattleButton 属性 |
| 3. 点击开始战斗后是否进入战斗 | 需要人工确认 | 未重新运行 Web 预览验证 |
| 4. 战斗逻辑是否运行 | 需要人工确认 | BattleManager/EnemySpawner/TowerManager 代码存在 |
| 5. 战斗倒计时是否运行 | 需要人工确认 | TimeManager 代码存在 |
| 6. 敌人逻辑是否生成 | 需要人工确认 | EnemySpawner 代码存在 |
| 7. 塔逻辑是否存在 | 需要人工确认 | TowerManager/TowerController 代码存在 |
| 8. 投射物逻辑是否存在 | 需要人工确认 | ProjectileManager 代码存在 |
| 9. 玩家是否能看到敌人节点 | 需要人工确认 | EnemyView/BattleVisualManager 代码存在 |
| 10. 玩家是否能看到塔节点 | 需要人工确认 | TowerView/BattleVisualManager 代码存在 |
| 11. 玩家是否能看到投射物或攻击反馈 | 需要人工确认 | AttackEffectView 代码存在 |
| 12. 敌人死亡是否有视觉消失 | 需要人工确认 | BattleVisualManager 有移除逻辑 |
| 13. 战斗结束是否有结算 UI | 需要人工确认 | SettlementPanel 节点存在，SettlementUI 代码存在 |
| 14. 结算资源是否进入基地系统 | 需要人工确认 | BattleSettlement/BaseManager 代码存在 |
| 15. 基地升级是否可用 | 需要人工确认 | BuildingPanel 节点存在，BuildingUI 代码存在 |
| 16. 下一局是否能体现成长 | 需要人工确认 | SaveManager/TowerUpgradeUI 代码存在 |
| 17. 离线收益是否可见可领 | 需要人工确认 | OfflineRewardPanel 节点存在，OfflineRewardUI 代码存在 |
| 18. 转生系统是否可见可用 | 需要人工确认 | RebirthUIRoot 节点存在，RebirthUI 代码存在 |
| 19. Web 预览是否完整验收过 | 不确定 | 未重新运行 Web 预览 |
| 20. 当前是否可以称为"可玩 demo" | 不确定 | 需要人工确认上述所有项 |

---

## 6. Cocos 场景与 UI 状态

### 6.1 场景文件

- `assets/scenes/Battle.scene` 存在
- `assets/scenes/Battle.scene.meta` 存在
- 由 Cocos Creator 保存（从格式判断）
- 未发现手写 JSON 风险

### 6.2 Canvas 下主要节点

从 Battle.scene 检索到的主要节点：

```txt
Canvas
├── Camera
├── GameBootstrap
├── UILayer（默认隐藏，开始战斗后显示）
│   ├── DebugInfoLabel
│   ├── TimerLabel
│   ├── BaseHpLabel
│   ├── StageLabel
│   ├── EnemyCountLabel
│   └── TowerCountLabel
├── BattleUIRoot
│   ├── OrbitalCannonButton
│   ├── FreezeButton
│   ├── RogueChoicePanel
│   │   ├── RogueChoiceTitleLabel
│   │   ├── RogueChoiceButton1
│   │   ├── RogueChoiceButton2
│   │   └── RogueChoiceButton3
│   └── ...（其他战斗UI元素）
├── OfflineRewardPanel
│   ├── Background
│   ├── OfflineTimeLabel
│   ├── RewardAmountLabel
│   ├── CapInfoLabel
│   ├── ClaimButton
│   └── AdDoubleButton
├── BuildingPanel
├── RebirthUIRoot
├── MainUIRoot
├── SettlementPanel
├── TowerUpgradePanel
├── SettingsUI
└── BattleVisualRoot
```

### 6.3 UI 面板状态

| 面板 | 用途 | 存在 | 挂组件 | 默认状态 | 显示时机 | 需人工确认 |
|------|------|------|--------|---------|---------|-----------|
| UILayer | 战斗信息层 | ✓ | 无（包含调试Label） | 隐藏 | 开始战斗后显示 | 确认Layout |
| MainUIRoot | 主界面入口 | ✓ | MainUI.ts | 显示 | 游戏启动时 | 确认Layout |
| BattleUIRoot | 战斗UI（技能/肉鸽） | ✓ | BattleUI.ts | 隐藏 | 战斗开始后 | 确认Layout |
| BuildingPanel | 建筑升级 | ✓ | BuildingUI.ts | 隐藏 | 进入建筑界面时 | 确认Layout |
| TowerUpgradePanel | 塔升级 | ✓ | TowerUpgradeUI.ts | 隐藏 | 进入塔升级界面时 | 确认Layout |
| RebirthUIRoot | 转生系统 | ✓ | RebirthUI.ts | 隐藏 | 进入转生界面时 | 确认Layout |
| SettlementPanel | 战斗结算 | ✓ | SettlementUI.ts | 隐藏 | 战斗结算时 | 确认Layout |
| SettingsUI | 设置 | ✓ | SettingsUI.ts | 隐藏 | 进入设置界面时 | 确认Layout |
| OfflineRewardPanel | 离线收益 | ✓ | OfflineRewardUI.ts | 隐藏 | 有离线收益时 | 确认Layout |

### 6.4 BattleVisualRoot 状态

- BattleVisualRoot 节点存在 ✓
- 是否挂载 BattleVisualManager：需要人工确认
- 是否绑定 TowerLayer：需要人工确认
- 是否绑定 EnemyLayer：需要人工确认
- 是否绑定 EffectLayer：需要人工确认
- 是否绑定 PathLayer：需要人工确认
- 运行时创建塔/怪/特效：从代码逻辑看应该可以，需要人工确认

### 6.5 当前 UI 混乱风险

**UILayer 默认隐藏，开始战斗后显示**：这是正确的设计，战斗 UI 元素（倒计时、基地血量、敌人数量等）只在战斗状态下显示。

**其他面板显隐状态需要人工确认**：
- MainUIRoot：应默认显示（主界面入口）
- BattleUIRoot：应默认隐藏，战斗开始后显示
- BuildingPanel：应默认隐藏，进入建筑界面时显示
- TowerUpgradePanel：应默认隐藏，进入塔升级界面时显示
- RebirthUIRoot：应默认隐藏，进入转生界面时显示
- SettlementPanel：应默认隐藏，战斗结算时显示
- SettingsUI：应默认隐藏，进入设置界面时显示
- OfflineRewardPanel：应默认隐藏，有离线收益时显示

建议人工在 Cocos Creator 中确认各面板的默认 active 状态是否正确。

---

## 7. 核心系统状态

### 7.1 Bootstrap / 启动流程

**GameBootstrap 职责**：

- 初始化系统
- 接入 BattleManager
- 接入 BaseManager
- 接入 IdleIncomeManager
- 接入 UI 主流程
- 接入 BattleVisualManager（通过事件监听）

**当前已知风险**：

- 未重新运行 Web 预览，不确定启动流程是否正常

### 7.2 EventBus

**当前职责**：模块间通信

**主要事件类型**：

- 战斗事件：BATTLE_START、BATTLE_END、BATTLE_SETTLEMENT、BATTLE_RESULT、ENEMY_SPAWN、ENEMY_DEATH、ENEMY_REACH_BASE、BASE_HEALTH_CHANGE、STAGE_WAVE_START、STAGE_BOSS_SPAWN、TIME_UPDATE
- UI 事件：无独立UI事件，通过GameManager状态管理
- 肉鸽事件：ROGUE_CHOICE_TRIGGER、ROGUE_CHOICE_SELECT、ROGUE_CHOICE_COMPLETE、BATTLE_FORCE_PAUSE、BATTLE_FORCE_RESUME
- 技能事件：SKILL_USE、SKILL_CHARGE_CHANGE、SKILL_ORBITAL_CANNON、SKILL_FREEZE
- 基地事件：REBIRTH_COMPLETE、PERMANENT_SKILL_UPGRADE
- 离线收益事件：IDLE_INCOME_TICK、OFFLINE_REWARD_READY、OFFLINE_REWARD_CLAIMED
- 可视化事件：TOWER_PLACED、TOWER_ATTACK

**事件解绑风险**：各组件在 onDestroy 中解绑，风险较低

### 7.3 Platform Adapter

**platform 目录文件**：

- `IPlatform.ts`
- `Platform.ts`
- `WebMockPlatform.ts`
- `WechatPlatform.ts`
- `DouyinPlatform.ts`
- `TapTapMiniPlatform.ts`

**合规性**：

- 不存在业务代码直接调用 wx / tt / tap / TapSDK
- 符合平台 API 只在 platform 目录内的规则

### 7.4 Config / 数据配置

**配置文件状态**：

| 配置 | 文件 | 状态 |
|------|------|------|
| ConfigManager | core/ConfigManager.ts | ✓ |
| TowerConfig | data/TowerConfig.ts | ✓ |
| EnemyConfig | data/EnemyConfig.ts | ✓ |
| StageConfig | data/StageConfig.ts | ✓ |
| BuildingConfig | data/BuildingConfig.ts | ✓ |
| SkillConfig | data/SkillConfig.ts | ✓ |
| EconomyConfig | data/EconomyConfig.ts | ✓ |
| RebirthConfig | data/RebirthConfig.ts | ✓ |

**已知问题**：

- 007 审查时发现 `rogue_electric_bounce` 配置与实际效果不一致，需要确认是否已修复
- 资源消耗类型需要确认是否按 BuildingConfig 正确配置

### 7.5 Battle / 战斗逻辑

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| BattleManager | battle/BattleManager.ts | 战斗流程管理 |
| StageManager | battle/StageManager.ts | 关卡管理 |
| TimeManager | core/TimeManager.ts | 时间管理 |
| EnemySpawner | battle/EnemySpawner.ts | 敌人生成 |
| EnemyController | battle/EnemyController.ts | 敌人控制 |
| TowerManager | battle/TowerManager.ts | 塔管理 |
| TowerController | battle/TowerController.ts | 塔控制 |
| ProjectileManager | battle/ProjectileManager.ts | 投射物管理 |

**当前状态**：

- 是逻辑层对象
- 是否创建 Cocos 节点：需要通过 BattleVisualManager 确认
- 当前是否看得到敌人、塔、投射物：需要人工 Web 预览确认

### 7.6 Battle Visual / 战斗可视化

**已实现文件**：

| 文件 | 职责 |
|------|------|
| BattleVisualManager | 战斗可视化管理器，监听事件创建/销毁节点 |
| EnemyView | 敌人可视化组件，Graphics绘制圆形+血条 |
| TowerView | 塔可视化组件，Graphics绘制矩形+闪烁反馈 |
| AttackEffectView | 攻击特效组件，Graphics绘制攻击线 |

**层级结构**（从代码推断）：

- TowerLayer：塔和槽位
- EnemyLayer：敌人
- EffectLayer：攻击特效
- PathLayer：路径点

**已知风险**：

- 未重新运行 Web 预览验证可视化效果
- 场景中 BattleVisualRoot 是否正确绑定需要人工确认

### 7.7 Rogue / Skills

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| RogueChoiceManager | battle/RogueChoiceManager.ts | 肉鸽选择管理 |
| SkillManager | battle/SkillManager.ts | 主动技能管理 |
| BattleUI | ui/BattleUI.ts | 战斗UI（技能按钮/肉鸽面板） |

**功能状态**：

- 轨道炮：实现，有UI入口
- 全屏冻结：实现，有UI入口
- 肉鸽 3 选 1：实现，有UI入口
- 次数限制：实现
- 无目标消耗次数风险：007 审查时发现，需要确认是否已修复

### 7.8 Base Building / 基地建筑

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| BaseManager | base/BaseManager.ts | 基地总管理 |
| BuildingManager | base/BuildingManager.ts | 建筑管理 |
| BuildingUI | ui/BuildingUI.ts | 建筑UI |
| SaveManager | core/SaveManager.ts | 存档管理 |

**功能状态**：

- 建筑列表：5个MVP建筑
- 建筑升级：实现
- 资源类型：baseCoin / battleCoin
- 消耗是否按 BuildingConfig：应该按配置
- BuildingUI 场景绑定状态：BuildingPanel 节点存在，需要人工确认绑定

### 7.9 Idle / Offline Reward

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| IdleIncomeManager | base/IdleIncomeManager.ts | 放置收益管理 |
| OfflineRewardUI | ui/OfflineRewardUI.ts | 离线收益UI |
| EconomyConfig | data/EconomyConfig.ts | 经济配置 |

**功能状态**：

- 在线收益：实现
- 离线收益：实现
- 离线时长上限：实现
- 领取逻辑：实现
- 是否接入 GameBootstrap：已接入
- 是否已 UI 验证：需要人工确认

### 7.10 Rebirth

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| RebirthManager | base/RebirthManager.ts | 转生管理 |
| RebirthUI | ui/RebirthUI.ts | 转生UI |

**功能状态**：

- 转生条件：基地核心10级 + 通关第10关
- 转生奖励：星核碎片
- 重置范围：战斗金币、经营币、建筑等级（基地核心除外）
- 是否接入主界面：RebirthUIRoot 节点存在
- 是否已验证：需要人工确认

### 7.11 UI Flow

**UI 面板列表**：

- MainUIRoot：主界面
- BattleUIRoot：战斗UI
- BuildingPanel：建筑升级
- TowerUpgradePanel：塔升级
- RebirthUIRoot：转生
- SettlementPanel：战斗结算
- SettingsUI：设置
- OfflineRewardPanel：离线收益

**流程状态**：

- 开始战斗流程：实现
- 返回主界面流程：实现
- UI 显隐管理：通过 GameManager 状态管理
- 当前面板是否杂乱：可能同时显示，需要人工确认
- 是否需要 Layout 整理：需要人工在 Cocos Creator 中确认

### 7.12 Platform Build

**012 完成状态**：

- Web 构建：已配置，待实测
- 微信小游戏构建：已配置，待 AppID/微信开发者工具实测
- 抖音小游戏构建：已配置，待 AppID/抖音开发者工具实测
- TapTap 小游戏构建：已配置，待转换工具实测

**是否只是构建链路**：是

**是否已实机验证**：否

**是否已提审**：否

**是否建议可玩 demo 完成后重新构建**：是

---

## 8. 当前主要问题和风险

1. **任务完成不等于可玩闭环完成**：001~012 都已完成，但实际可玩性需要人工验证。

2. **012 构建完成不等于提审质量达标**：只是配置了构建目标，未实机验证。

3. **当前可能仍缺少完整战斗可视化**：011.5 已实现，但效果需要人工确认。

4. **当前 UI 面板可能同时显示**：导致画面混乱，需要人工在 Cocos Creator 中设置默认显隐。

5. **Cocos 场景绑定必须人工确认**：从 scene 文件可以看到节点名，但组件绑定和属性赋值需要打开 Cocos Creator 确认。

6. **新增脚本 .meta 必须提交**：当前所有 .meta 已提交，后续新增脚本时注意。

7. **Battle.scene 不得手写 JSON**：必须通过 Cocos Creator 编辑器保存。

8. **Web 预览结果必须人工确认**：未重新运行 Web 预览，不确定当前状态。

9. **平台包可能需要在可玩 demo 完成后重新构建**：012 只是配置，实际构建需要人工操作。

10. **如果 Scene 中有 Missing Script**：必须先修复，当前未确认是否有 Missing Script。

11. **如果 UI active 状态错误**：运行画面会混乱，需要人工确认。

12. **如果可视化层直接改战斗逻辑**：后续风险高，当前代码分离良好。

13. **如果继续平台提审**：会暴露 demo 不可玩的问题。

---

## 9. 当前禁止事项

- 不自动提交 Git
- 不手写 Battle.scene JSON
- 不提交 Cocos 缓存目录（library/、temp/、build/、profiles/、native/）
- 不提交 node_modules
- 不直接调用平台 API（wx/tt/tap/TapSDK）
- 不接服务器
- 不接支付
- 不做正式平台提审
- 不引入不必要依赖
- 不重写战斗系统
- 不越权做后续任务
- 不在 develop 上直接做未审查功能
- 不把"未验证"写成"已通过"

---

## 10. 下一步建议

根据当前仓库状态：

1. **不回滚 012**：保留 012 作为构建链路成果。

2. **暂停平台提审**：当前 demo 可玩性未确认，不适合提审。

3. **人工确认 011.5 可视化效果**：
   - 用 Cocos Creator 3.8.x 打开项目
   - 运行 Web 预览
   - 确认能否看到塔、敌人、攻击反馈、死亡消失
   - 确认战斗结算是否正常

4. **如果 011.5 效果不完整**：新建 `TASKS/013-playable-battle-visual-demo.md` 补充可视化。

5. **如果 011.5 效果完整**：新建 `TASKS/013-playable-loop-integration.md` 完善可玩闭环。

6. **最后重新构建平台包**：准备提审。

建议任务顺序：

```txt
013-playable-loop-integration（战斗结算资源 → 回基地升级 → 再战斗变强）
014-demo-polish-and-first-run（首次体验调优、默认资源、UI显隐、调试Label清理）
最后重新构建平台包，准备提审
```

---

## 11. 建议的 013 任务摘要

如果需要新增可视化任务：

```txt
任务名：013-playable-battle-visual-demo

目标：让玩家在 Web 预览中肉眼看到塔打怪的完整过程。

验收：
主界面 -> 开始战斗 -> 可见塔 -> 可见敌人 -> 敌人移动 -> 攻击反馈 -> 敌人死亡 -> 结算

禁止：
不做平台构建，不接 SDK，不重写战斗系统，不做正式美术，不引入新依赖。
```

如果 011.5 已完整实现，则建议：

```txt
任务名：013-playable-loop-integration

目标：让玩家体验完整的"打怪 → 结算 → 升级 → 再打变强"循环。

验收：
战斗结算 → 资源入账 → 回基地 → 升级塔/建筑 → 再次战斗 → 感受到变强

禁止：
不做平台构建，不接 SDK，不引入新依赖。
```

---

## 12. 给下一位执行 Agent 的提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前仓库路径：
D:\project\starfortress-project

当前分支：
develop

当前建议任务：
1. 先人工运行 Web 预览，确认 011.5 可视化效果
2. 根据效果决定是否需要 013 补充任务

需要先读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. 当前 TASKS 文件

需要先执行：
git status --short --branch --untracked-files=all
git log --oneline -10

严格要求：
1. 只做当前任务
2. 不自动提交 Git
3. 不手写 .scene JSON
4. 不接平台 API
5. 不引入依赖
6. Cocos 场景绑定必须通过 Cocos Creator 编辑器完成

Web 预览验收标准：
1. 主界面显示正常
2. 点击开始战斗进入战斗
3. 能看到塔节点
4. 能看到敌人节点和移动
5. 能看到攻击反馈
6. 敌人死亡后节点消失
7. 战斗结算正常显示
8. 结算资源正确入账
```

---

## 13. 给 Codex 审查员的提示词

```txt
你是《星垒计划 / Starfortress Project》的代码审查员。

请审查执行 Agent 当前产生的改动，不要直接修改代码。

当前任务文件：
根据实际任务确定 TASKS/xxx.md

审查前必须读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. 当前 TASKS 文件
8. 本次新增或修改的关键文件

重点检查：
1. 是否符合当前 TASKS 任务
2. 是否只完成了当前任务
3. 是否存在越权修改
4. git status 是否干净
5. git diff 是否符合预期
6. 新增 .meta 是否存在
7. Battle.scene 是否手写 JSON 风险
8. Cocos 场景绑定是否正确
9. Web 预览结果是否正常
10. 是否能进入下一任务

请输出：
1. 审查结论：通过 / 不通过
2. 必须修复项
3. 建议优化项
4. 是否允许提交
5. 如果不通过，给最小修复提示词
6. 如果通过，给提交建议

提交建议格式：
git add [文件列表]
git commit -m "feat(xxx): 描述"
```

---

## 14. 不确定内容说明

以下内容未实际验证，需要人工确认：

1. Web 预览是否能正常运行
2. 战斗可视化效果是否完整
3. UI 面板默认显隐是否正确
4. BattleVisualManager 组件绑定是否正确
5. 各 UI 面板 Layout 是否合理
6. 是否存在 Missing Script
7. 平台构建是否能正常生成产物
8. 实际可玩性是否达标

---

*本文档基于仓库文件和 git 命令输出生成，未运行 Web 预览，未打开 Cocos Creator。*
