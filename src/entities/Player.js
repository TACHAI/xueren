// 雪人打怪兽 - 玩家角色
// 玩家雪人：支持左右移动、跳跃、喷射雪球，拥有血量、道具系统

const DrawUtils = require('../utils/Draw')

class Player {
  /**
   * 创建玩家
   * @param {number} x - 初始 X 坐标
   * @param {number} y - 初始 Y 坐标
   */
  constructor(x, y) {
    // 位置和速度
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.width = 36      // 碰撞体宽度
    this.height = 50     // 碰撞体高度

    // 移动参数
    this.baseSpeed = 250
    this.speed = 250     // 当前移动速度（可被道具提升）
    this.maxSpeed = 420
    this.jumpForce = 600 // 跳跃初速度
    this.gravity = 1200  // 重力加速度

    // 状态标志
    this.onGround = false
    this.facing = 1      // 朝向：1右 / -1左
    this.isMoving = false
    this.isJumping = false
    this.isShooting = false

    // 生命值
    this.hp = 3
    this.maxHp = 3
    this.invincible = 0    // 无敌时间（秒）
    this.invincibleMax = 1.5

    // 射击参数
    this.baseShootCooldownMax = 0.3
    this.shootCooldownMax = 0.3
    this.minShootCooldown = 0.1
    this.shootCooldown = 0
    this.snowballRadius = 8     // 雪球半径
    this.maxSnowballRadius = 16

    // 动画参数
    this.animTime = 0
    this.wobble = 0

    // 道具累计计数
    this.powerUps = {
      bigSnow: 0,      // 巨雪球
      fastShoot: 0,    // 速射
      fastMove: 0      // 疾风
    }
  }

  /**
   * 更新玩家状态（每帧调用）
   * @param {number} dt - 帧间隔（秒）
   * @param {object} input - 输入状态 { left, right, jump, shoot }
   * @param {Array} platforms - 平台数组
   */
  update(dt, input, platforms) {
    // 更新计时器
    if (this.invincible > 0) this.invincible -= dt
    if (this.shootCooldown > 0) this.shootCooldown -= dt

    this.animTime += dt
    this.isMoving = false

    // 处理水平移动
    let moveInput = 0
    if (input.left) moveInput -= 1
    if (input.right) moveInput += 1

    if (moveInput !== 0) {
      this.vx = moveInput * this.speed
      this.facing = moveInput
      this.isMoving = true
    } else {
      // 减速停止
      this.vx *= 0.8
      if (Math.abs(this.vx) < 5) this.vx = 0
    }

    // 处理跳跃
    if (input.jump && this.onGround) {
      this.vy = -this.jumpForce
      this.onGround = false
      this.isJumping = true
    }

    // 应用重力
    this.vy += this.gravity * dt
    if (this.vy > 800) this.vy = 800

    // 更新位置
    this.x += this.vx * dt
    this.y += this.vy * dt

    // 摆动动画
    this.wobble += dt * (this.isMoving ? 10 : 3)

    // 平台碰撞检测
    this.handlePlatformCollision(platforms, dt)
  }

  /**
   * 处理与平台的碰撞（从上方落到平台）
   * @param {Array} platforms - 平台数组
   * @param {number} dt - 本帧时长（秒），用于精确回推上一帧位置，避免低帧率穿透
   */
  handlePlatformCollision(platforms, dt = 0.016) {
    this.onGround = false

    for (const platform of platforms) {
      if (!platform) continue

      const rect = platform.getRect()
      const playerBottom = this.y + this.height / 2
      const playerLeft = this.x - this.width / 2
      const playerRight = this.x + this.width / 2

      // 检查玩家是否在平台水平范围内
      if (playerRight > rect.x && playerLeft < rect.x + rect.width) {
        // 从上方落到平台上（下落中，底部越过平台顶部）
        // 用真实 dt 回推上一帧底部位置，确保低帧率（dt 较大）下不会穿透平台
        if (this.vy >= 0 && playerBottom > rect.y && playerBottom - this.vy * dt <= rect.y + 5) {
          this.y = rect.y - this.height / 2
          this.vy = 0
          this.onGround = true
          this.isJumping = false
        }
      }
    }
  }

  /**
   * 检查是否可以射击
   * @returns {boolean}
   */
  canShoot() {
    return this.shootCooldown <= 0
  }

  /**
   * 执行射击，返回雪球初始数据
   * @returns {object|null} 雪球数据或 null（冷却中）
   */
  shoot() {
    if (!this.canShoot()) return null
    this.shootCooldown = this.shootCooldownMax
    this.isShooting = true
    setTimeout(() => { this.isShooting = false }, 150)

    return {
      x: this.x + this.facing * 22,
      y: this.y - 15,
      vx: this.facing * 350,
      vy: 0,
      radius: this.snowballRadius
    }
  }

  /**
   * 应用道具效果
   * @param {string} type - 道具类型：bigSnow / fastShoot / fastMove
   */
  applyPowerUp(type) {
    this.powerUps[type] = (this.powerUps[type] || 0) + 1
    switch (type) {
      case 'bigSnow':
        this.snowballRadius = Math.min(this.maxSnowballRadius, this.snowballRadius + 3)
        break
      case 'fastShoot':
        this.shootCooldownMax = Math.max(this.minShootCooldown, this.shootCooldownMax - 0.06)
        break
      case 'fastMove':
        this.speed = Math.min(this.maxSpeed, this.speed + 40)
        break
    }
  }

  /**
   * 受到伤害
   * @returns {boolean} 是否成功受伤（无敌时返回 false）
   */
  takeDamage() {
    if (this.invincible > 0) return false
    this.hp = Math.max(0, this.hp - 1)
    this.invincible = this.invincibleMax
    return true
  }

  /**
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 计算摆动角度
    let wobble = 0
    if (this.isMoving && this.onGround) {
      wobble = Math.sin(this.wobble) * 0.05
    } else if (this.isJumping) {
      wobble = Math.sin(this.wobble * 0.5) * 0.02
    } else {
      wobble = Math.sin(this.wobble) * 0.02
    }

    // 无敌状态半透明
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    // 绘制雪人（朝向决定水平翻转）
    const scale = 0.55 + (this.isShooting ? 0.05 : 0)
    DrawUtils.drawSnowman(ctx, this.x, this.y, scale, {
      isEnemy: false,
      wobble: wobble,
      facing: this.facing
    })

    ctx.globalAlpha = 1

    // 射击特效：枪口小雪花
    if (this.isShooting) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      const snX = this.x + this.facing * 28
      const snY = this.y - 15
      ctx.arc(snX, snY, 7, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 获取碰撞矩形
   * @returns {{x:number, y:number, width:number, height:number}}
   */
  getRect() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    }
  }

  /**
   * 获取圆形碰撞范围（用于拾取道具等）
   * @returns {{x:number, y:number, radius:number}}
   */
  getHitCircle() {
    return { x: this.x, y: this.y, radius: 35 }
  }
}

module.exports = Player
