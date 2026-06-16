/**
 * 敌人生成器
 * 根据关卡波次配置生成敌人
 */

import { EnemyController } from './EnemyController';
import { StageConfig } from '../data/StageConfig';
import { EnemyConfig, getEnemyConfig } from '../data/EnemyConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { StageManager, BASE_CENTER } from './StageManager';

export class EnemySpawner {
    private _stageConfig: StageConfig;
    private _enemies: Map<string, EnemyController> = new Map();
    private _stageManager: StageManager;
    private _eventBus: EventBus;
    private _currentWaveIndex: number = 0;
    private _waveSpawnTimers: Map<number, number> = new Map();
    private _waveSpawnedCounts: Map<number, number> = new Map();
    private _waveStartedSet: Set<number> = new Set();
    private _bossSpawned: boolean = false;

    constructor(stageConfig: StageConfig, stageManager: StageManager) {
        this._stageConfig = stageConfig;
        this._stageManager = stageManager;
        this._eventBus = EventBus.getInstance();
    }

    /**
     * 开始生成敌人
     */
    start(): void {
        this._currentWaveIndex = 0;
        this._bossSpawned = false;
        this._waveSpawnTimers.clear();
        this._waveSpawnedCounts.clear();
        this._waveStartedSet.clear();

        // 初始化波次计时器和已生成数量
        this._stageConfig.waves.forEach((wave, index) => {
            this._waveSpawnTimers.set(index, 0);
            this._waveSpawnedCounts.set(index, 0);
        });
    }

    /**
     * 更新敌人生成（每帧调用）
     */
    update(deltaTime: number, currentTime: number): void {
        // 检查波次生成
        this._stageConfig.waves.forEach((wave, index) => {
            if (currentTime >= wave.time) {
                // 每波首次开始生成时触发波次开始事件
                if (!this._waveStartedSet.has(index)) {
                    this._waveStartedSet.add(index);
                    this._currentWaveIndex = index;
                    this._eventBus.emit(BATTLE_EVENTS.STAGE_WAVE_START, { waveIndex: index });
                }
                this._spawnWaveIfNeeded(index, deltaTime);
            }
        });

        // 检查 Boss 生成
        if (!this._bossSpawned && currentTime >= this._stageConfig.bossTime) {
            this._spawnBoss();
        }

        // 更新所有敌人
        this._enemies.forEach(enemy => {
            if (enemy.isAlive()) {
                enemy.update(deltaTime);
            }
        });
    }

    /**
     * 生成波次敌人
     */
    private _spawnWaveIfNeeded(waveIndex: number, deltaTime: number): void {
        const wave = this._stageConfig.waves[waveIndex];
        if (!wave) return;

        // 已达到该波生成上限，停止生成
        const spawnedCount = this._waveSpawnedCounts.get(waveIndex) || 0;
        if (spawnedCount >= wave.count) return;

        const timer = this._waveSpawnTimers.get(waveIndex) || 0;
        const newTimer = timer + deltaTime;

        // 检查是否应该生成敌人
        if (newTimer >= wave.interval) {
            const enemyConfig = getEnemyConfig(wave.enemyId);
            if (enemyConfig) {
                this._spawnEnemy(wave.enemyId, enemyConfig);
            }
            this._waveSpawnedCounts.set(waveIndex, spawnedCount + 1);
            this._waveSpawnTimers.set(waveIndex, 0);
        } else {
            this._waveSpawnTimers.set(waveIndex, newTimer);
        }
    }

    /**
     * 生成单个敌人（使用随机路径）
     */
    private _spawnEnemy(configId: string, config: EnemyConfig): void {
        // 获取随机路径
        const path = this._stageManager.getRandomSpawnPath();
        const spawnPosition = path[0] || { x: 0, y: 0 };
        const enemy = new EnemyController(configId, config, path, spawnPosition);
        this._enemies.set(enemy.getId(), enemy);

        this._eventBus.emit(BATTLE_EVENTS.ENEMY_SPAWN, {
            enemyId: enemy.getId(),
            configId: configId,
            position: spawnPosition
        });
    }

    /**
     * 生成 Boss
     */
    private _spawnBoss(): void {
        const bossConfig = getEnemyConfig(this._stageConfig.bossEnemyId);
        if (bossConfig) {
            this._spawnEnemy(this._stageConfig.bossEnemyId, bossConfig);
            this._bossSpawned = true;
            this._eventBus.emit(BATTLE_EVENTS.STAGE_BOSS_SPAWN, {
                bossId: this._stageConfig.bossEnemyId
            });
        }
    }

    /**
     * 从指定位置生成敌人（用于分裂逻辑）
     * 子单位继承父单位的路径目标点，从死亡位置继续向基地方向移动
     *
     * @param configId 敌人配置ID
     * @param position 生成位置（父敌人死亡位置）
     * @param parentPath 父敌人的路径（可选，用于继承目标点）
     * @param parentPathIndex 父敌人的路径索引（可选）
     */
    spawnEnemyAtPosition(
        configId: string,
        position: { x: number; y: number },
        parentPath?: { x: number; y: number }[],
        parentPathIndex?: number
    ): void {
        const config = getEnemyConfig(configId);
        if (!config) return;

        // 构建子单位路径：从死亡位置到父单位的目标点
        // 如果父单位路径可用，继承目标点；否则使用基地中心
        let path: { x: number; y: number }[];
        if (parentPath && parentPath.length >= 2) {
            // 继承父单位的目标点（路径最后一个点）
            const targetPoint = parentPath[parentPath.length - 1];
            path = [position, targetPoint];
        } else {
            // 兜底：从死亡位置到基地中心
            path = [position, { x: BASE_CENTER.x, y: BASE_CENTER.y }];
        }

        const enemy = new EnemyController(configId, config, path, position);
        this._enemies.set(enemy.getId(), enemy);

        this._eventBus.emit(BATTLE_EVENTS.ENEMY_SPAWN, {
            enemyId: enemy.getId(),
            configId: configId,
            position: position
        });
    }

    /**
     * 获取所有存活的敌人
     */
    getAliveEnemies(): EnemyController[] {
        return Array.from(this._enemies.values()).filter(enemy => enemy.isAlive());
    }

    /**
     * 获取所有敌人（包括死亡的）
     */
    getAllEnemies(): EnemyController[] {
        return Array.from(this._enemies.values());
    }

    /**
     * 根据ID获取敌人
     */
    getEnemy(enemyId: string): EnemyController | undefined {
        return this._enemies.get(enemyId);
    }

    /**
     * 移除死亡的敌人
     */
    removeDeadEnemies(): void {
        this._enemies.forEach((enemy, id) => {
            if (!enemy.isAlive()) {
                this._enemies.delete(id);
            }
        });
    }

    /**
     * 获取当前波次索引
     */
    getCurrentWaveIndex(): number {
        return this._currentWaveIndex;
    }

    /**
     * 是否已生成 Boss
     */
    isBossSpawned(): boolean {
        return this._bossSpawned;
    }

    /**
     * 获取敌人总数
     */
    getEnemyCount(): number {
        return this._enemies.size;
    }

    /**
     * 清除所有敌人
     */
    clear(): void {
        this._enemies.clear();
        this._waveSpawnTimers.clear();
        this._waveStartedSet.clear();
        this._bossSpawned = false;
    }
}