// 雪人打怪兽 - 关卡管理系统
// 管理 8 个关卡的平台、敌人、道具配置

const Platform = require('../entities/Platform')
const Enemy = require('../entities/Enemy')
const PowerUp = require('../entities/PowerUp')

const LEVELS = [
  {
    name: '第1关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 80, y: 460, width: 280, height: 15 },
      { x: 390, y: 460, width: 280, height: 15 },
      { x: 235, y: 340, width: 280, height: 15 },
      { x: 80, y: 220, width: 280, height: 15 },
      { x: 390, y: 220, width: 280, height: 15 }
    ],
    enemyTypes: ['basic', 'basic', 'basic', 'basic', 'basic'],
    spawnPoints: [
      { x: 220, y: 410 },
      { x: 530, y: 410 },
      { x: 375, y: 290 },
      { x: 220, y: 190 },
      { x: 530, y: 190 }
    ],
    playerStart: { x: 60, y: 540 }
  },
  {
    name: '第2关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 40, y: 480, width: 200, height: 15 },
      { x: 190, y: 420, width: 200, height: 15 },
      { x: 340, y: 360, width: 200, height: 15 },
      { x: 490, y: 440, width: 200, height: 15 },
      { x: 100, y: 290, width: 550, height: 15 },
      { x: 120, y: 180, width: 500, height: 15 }
    ],
    enemyTypes: ['basic', 'basic', 'fast', 'basic', 'fast', 'basic'],
    spawnPoints: [
      { x: 140, y: 430 },
      { x: 290, y: 370 },
      { x: 440, y: 310 },
      { x: 590, y: 390 },
      { x: 375, y: 240 },
      { x: 375, y: 150 }
    ],
    playerStart: { x: 40, y: 540 }
  },
  {
    name: '第3关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 20, y: 500, width: 160, height: 15 },
      { x: 150, y: 450, width: 160, height: 15 },
      { x: 280, y: 420, width: 160, height: 15 },
      { x: 410, y: 450, width: 160, height: 15 },
      { x: 540, y: 500, width: 160, height: 15 },
      { x: 50, y: 330, width: 650, height: 15 },
      { x: 140, y: 230, width: 470, height: 15 },
      { x: 190, y: 120, width: 350, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'fast'],
    spawnPoints: [
      { x: 100, y: 450 },
      { x: 230, y: 400 },
      { x: 360, y: 370 },
      { x: 490, y: 400 },
      { x: 620, y: 450 },
      { x: 375, y: 280 },
      { x: 375, y: 180 },
      { x: 375, y: 90 }
    ],
    playerStart: { x: 40, y: 540 }
  },
  {
    name: '第4关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 50, y: 490, width: 220, height: 15 },
      { x: 230, y: 430, width: 220, height: 15 },
      { x: 410, y: 430, width: 220, height: 15 },
      { x: 590, y: 490, width: 140, height: 15 },
      { x: 80, y: 310, width: 300, height: 15 },
      { x: 370, y: 310, width: 300, height: 15 },
      { x: 235, y: 200, width: 280, height: 15 },
      { x: 235, y: 90, width: 280, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'basic'],
    spawnPoints: [
      { x: 160, y: 440 },
      { x: 340, y: 380 },
      { x: 520, y: 380 },
      { x: 660, y: 440 },
      { x: 230, y: 260 },
      { x: 520, y: 260 },
      { x: 375, y: 150 },
      { x: 375, y: 60 }
    ],
    playerStart: { x: 40, y: 540 }
  },
  {
    name: '第5关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 30, y: 510, width: 180, height: 15 },
      { x: 170, y: 460, width: 180, height: 15 },
      { x: 310, y: 410, width: 180, height: 15 },
      { x: 450, y: 460, width: 180, height: 15 },
      { x: 60, y: 330, width: 350, height: 15 },
      { x: 340, y: 330, width: 350, height: 15 },
      { x: 190, y: 220, width: 350, height: 15 },
      { x: 190, y: 110, width: 350, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'fast', 'basic'],
    spawnPoints: [
      { x: 120, y: 460 },
      { x: 260, y: 410 },
      { x: 400, y: 360 },
      { x: 540, y: 410 },
      { x: 235, y: 280 },
      { x: 515, y: 280 },
      { x: 375, y: 170 },
      { x: 375, y: 280 },
      { x: 375, y: 80 }
    ],
    playerStart: { x: 30, y: 540 }
  },
  {
    name: '第6关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 20, y: 520, width: 160, height: 15 },
      { x: 140, y: 470, width: 160, height: 15 },
      { x: 260, y: 420, width: 160, height: 15 },
      { x: 380, y: 470, width: 160, height: 15 },
      { x: 500, y: 520, width: 160, height: 15 },
      { x: 60, y: 340, width: 340, height: 15 },
      { x: 230, y: 290, width: 320, height: 15 },
      { x: 400, y: 340, width: 340, height: 15 },
      { x: 235, y: 200, width: 280, height: 15 },
      { x: 260, y: 150, width: 260, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'fast', 'fast', 'basic'],
    spawnPoints: [
      { x: 100, y: 470 },
      { x: 220, y: 420 },
      { x: 340, y: 370 },
      { x: 460, y: 420 },
      { x: 580, y: 470 },
      { x: 230, y: 290 },
      { x: 390, y: 240 },
      { x: 570, y: 290 },
      { x: 375, y: 150 },
      { x: 390, y: 120 }
    ],
    playerStart: { x: 20, y: 540 }
  },
  {
    name: '第7关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 20, y: 530, width: 140, height: 15 },
      { x: 120, y: 480, width: 140, height: 15 },
      { x: 220, y: 430, width: 140, height: 15 },
      { x: 320, y: 430, width: 140, height: 15 },
      { x: 420, y: 480, width: 140, height: 15 },
      { x: 520, y: 530, width: 140, height: 15 },
      { x: 40, y: 340, width: 280, height: 15 },
      { x: 220, y: 310, width: 320, height: 15 },
      { x: 420, y: 340, width: 280, height: 15 },
      { x: 235, y: 200, width: 280, height: 15 },
      { x: 200, y: 130, width: 350, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'fast', 'fast', 'basic', 'fast'],
    spawnPoints: [
      { x: 90, y: 480 },
      { x: 190, y: 430 },
      { x: 290, y: 380 },
      { x: 390, y: 380 },
      { x: 490, y: 430 },
      { x: 590, y: 480 },
      { x: 180, y: 290 },
      { x: 380, y: 260 },
      { x: 560, y: 290 },
      { x: 375, y: 150 },
      { x: 375, y: 100 }
    ],
    playerStart: { x: 20, y: 540 }
  },
  {
    name: '第8关',
    platforms: [
      { x: 0, y: 600, width: 750, height: 20 },
      { x: 10, y: 530, width: 140, height: 15 },
      { x: 110, y: 480, width: 140, height: 15 },
      { x: 210, y: 430, width: 140, height: 15 },
      { x: 310, y: 430, width: 140, height: 15 },
      { x: 410, y: 480, width: 140, height: 15 },
      { x: 510, y: 530, width: 140, height: 15 },
      { x: 620, y: 530, width: 120, height: 15 },
      { x: 30, y: 330, width: 240, height: 15 },
      { x: 210, y: 290, width: 320, height: 15 },
      { x: 440, y: 290, width: 240, height: 15 },
      { x: 560, y: 330, width: 160, height: 15 },
      { x: 235, y: 180, width: 280, height: 15 },
      { x: 260, y: 50, width: 220, height: 15 }
    ],
    enemyTypes: ['basic', 'fast', 'basic', 'fast', 'basic', 'fast', 'big', 'fast', 'fast', 'basic', 'fast', 'big'],
    spawnPoints: [
      { x: 80, y: 480 },
      { x: 180, y: 430 },
      { x: 280, y: 380 },
      { x: 380, y: 380 },
      { x: 480, y: 430 },
      { x: 580, y: 480 },
      { x: 150, y: 280 },
      { x: 375, y: 240 },
      { x: 560, y: 240 },
      { x: 640, y: 280 },
      { x: 375, y: 130 },
      { x: 375, y: 20 }
    ],
    playerStart: { x: 20, y: 540 }
  }
]

/**
 * 根据已通关关卡索引获取可用道具池
 * @param {number} completedLevelIndex - 已通关的关卡索引（0基）
 * @returns {string[]} 可用道具类型数组
 */
function getAvailablePowerUps(completedLevelIndex) {
  const pool = []
  // 第3关后解锁巨雪球
  if (completedLevelIndex >= 2) pool.push(PowerUp.TYPE.BIG_SNOW)
  // 第4关后解锁速射
  if (completedLevelIndex >= 3) pool.push(PowerUp.TYPE.FAST_SHOOT)
  // 第5关后解锁疾风
  if (completedLevelIndex >= 4) pool.push(PowerUp.TYPE.FAST_MOVE)
  return pool
}

/**
 * 关卡管理器：负责加载关卡、管理平台和敌人
 */
class LevelManager {
  constructor() {
    this.currentLevel = 0   // 当前关卡索引
    this.platforms = []     // 平台数组
    this.enemies = []       // 敌人数组
    this.width = 750
    this.height = 800
    this.name = ''          // 当前关卡名称
    this.playerStart = { x: 60, y: 540 }  // 玩家出生点
    this.levelOffsetY = 100 // 关卡整体 Y 偏移（让平台更靠下）
  }

  /**
   * 加载指定关卡
   * @param {number} levelIndex - 关卡索引
   */
  loadLevel(levelIndex) {
    this.currentLevel = levelIndex
    const config = LEVELS[levelIndex]
    const oy = this.levelOffsetY

    // 创建平台（加上 Y 偏移）
    this.platforms = config.platforms.map((p, i) => new Platform(p.x, p.y + oy, p.width, p.height, i))

    // 创建敌人（根据类型设置属性）
    this.enemies = config.spawnPoints.map((sp, i) => {
      const platform = this.findPlatformAt(sp.x, sp.y + oy)
      const enemy = new Enemy(sp.x, sp.y + oy, platform)
      const type = config.enemyTypes[i] || 'basic'
      if (type === 'fast') {
        enemy.walkSpeed = 80   // 快速敌人
      } else if (type === 'big') {
        enemy.width = 50       // 大型敌人
        enemy.height = 65
        enemy.walkSpeed = 35
        enemy.maxCoverage = 4  // 需要更多命中
      }
      return enemy
    })

    // 设置玩家出生点
    const ps = config.playerStart || { x: 60, y: 540 }
    this.playerStart = { x: ps.x, y: ps.y + oy }
    this.name = config.name
  }

  /**
   * 查找指定位置附近的平台
   * @param {number} x
   * @param {number} y
   * @returns {Platform|null}
   */
  findPlatformAt(x, y) {
    for (const platform of this.platforms) {
      const rect = platform.getRect()
      if (x >= rect.x && x <= rect.x + rect.width && Math.abs(y - rect.y) < 120) {
        return platform
      }
    }
    return this.platforms[0]
  }

  /**
   * 获取关卡总数
   * @returns {number}
   */
  getLevelCount() {
    return LEVELS.length
  }

  /**
   * 是否是最后一关
   * @returns {boolean}
   */
  isLastLevel() {
    return this.currentLevel >= LEVELS.length - 1
  }

  /**
   * 检查当前关卡是否完成（所有敌人死亡）
   * @returns {boolean}
   */
  isLevelComplete() {
    if (this.enemies.length === 0) return false
    return this.enemies.every(e => e.state === 'dead')
  }

  /**
   * 加载下一关
   * @returns {boolean} 是否成功
   */
  nextLevel() {
    if (this.currentLevel + 1 < LEVELS.length) {
      this.loadLevel(this.currentLevel + 1)
      return true
    }
    return false
  }

  /**
   * 更新所有平台（每帧调用）
   * @param {number} dt - 帧间隔
   */
  update(dt) {
    for (const platform of this.platforms) {
      platform.update(dt)
    }
  }
}

LevelManager.getAvailablePowerUps = getAvailablePowerUps
module.exports = LevelManager
