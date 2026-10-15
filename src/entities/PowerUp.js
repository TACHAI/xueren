// 雪人打怪兽 - 道具系统
// 三种道具：巨雪球、速射、疾风

const DrawUtils = require('../utils/Draw')

// 道具类型枚举
const POWERUP_TYPE = {
  BIG_SNOW: 'bigSnow',      // 巨雪球
  FAST_SHOOT: 'fastShoot',  // 速射
  FAST_MOVE: 'fastMove'     // 疾风
}

// 道具信息配置
const POWERUP_INFO = {
  [POWERUP_TYPE.BIG_SNOW]: {
    name: '巨雪球',
    color: '#3498db',
    glow: '#85c1e9',
    icon: '❄'
  },
  [POWERUP_TYPE.FAST_SHOOT]: {
    name: '速射',
    color: '#e74c3c',
    glow: '#f1948a',
    icon: '⚡'
  },
  [POWERUP_TYPE.FAST_MOVE]: {
    name: '疾风',
    color: '#2ecc71',
    glow: '#82e0aa',
    icon: '✦'
  }
}

class PowerUp {
  /**
   * 创建道具
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {string} type - 道具类型
   */
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type
    this.radius = 22
    this.animTime = 0
    this.collected = false
    this.collectAnim = 0
    this.life = 0

    // 下落动画参数
    this.fallVy = -200
    this.landed = false
    this.restY = y
    this.info = POWERUP_INFO[type]
  }

  /**
   * 更新道具状态（每帧调用）
   * @param {number} dt - 帧间隔
   * @param {Array} platforms - 平台数组（用于下落检测）
   */
  update(dt, platforms) {
    this.animTime += dt
    this.life += dt

    // 已收集：播放消失动画
    if (this.collected) {
      this.collectAnim += dt
      this.y -= 150 * dt
      return
    }

    // 已落地：悬停效果
    if (this.landed) {
      this.y = this.restY + Math.sin(this.animTime * 3) * 6
      return
    }

    // 下落物理
    this.fallVy += 1400 * dt
    this.y += this.fallVy * dt

    // 检测是否落到平台上
    if (platforms) {
      for (const platform of platforms) {
        if (!platform) continue
        const rect = platform.getRect()
        const bottom = this.y + this.radius
        if (this.x > rect.x && this.x < rect.x + rect.width) {
          if (this.fallVy >= 0 && bottom > rect.y && bottom < rect.y + 40) {
            this.y = rect.y - this.radius
            this.restY = this.y
            this.landed = true
            this.fallVy = 0
            return
          }
        }
      }
    }
  }

  /**
   * 检查是否过期（收集后动画结束）
   * @returns {boolean}
   */
  isExpired() {
    return this.collected && this.collectAnim > 0.5
  }

  /**
   * 被玩家收集
   * @returns {boolean} 是否成功收集
   */
  collect() {
    if (this.collected) return false
    this.collected = true
    this.collectAnim = 0
    return true
  }

  /**
   * 渲染道具：圆形图标 + 发光效果 + 脉动动画
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    const info = this.info
    let alpha = 1
    let scale = 1

    // 淡出/缩放效果
    if (this.collected) {
      alpha = Math.max(0, 1 - this.collectAnim / 0.5)
      scale = 1 + this.collectAnim * 2
    } else if (this.life < 0.3) {
      alpha = this.life / 0.3
    }

    const bob = this.landed ? Math.sin(this.animTime * 3) * 0.1 : 0

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(this.x, this.y)
    ctx.rotate(bob)
    ctx.scale(scale, scale)

    // 脉动效果
    const pulse = 1 + Math.sin(this.animTime * 5) * 0.08
    const r = this.radius * pulse

    // 发光阴影
    ctx.shadowColor = info.glow
    ctx.shadowBlur = 20

    // 渐变圆形主体
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
    gradient.addColorStop(0, info.glow)
    gradient.addColorStop(0.7, info.color)
    gradient.addColorStop(1, '#ffffff')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowColor = 'transparent'

    // 白色边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()

    // 图标文字
    ctx.fillStyle = '#ffffff'
    DrawUtils.setFont(ctx, 22, true)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(info.icon, 0, 1)

    ctx.restore()
  }

  /**
   * 获取碰撞圆（扩大范围便于拾取）
   * @returns {{x:number, y:number, radius:number}}
   */
  getHitCircle() {
    return { x: this.x, y: this.y, radius: this.radius + 8 }
  }
}

PowerUp.TYPE = POWERUP_TYPE
PowerUp.INFO = POWERUP_INFO
module.exports = PowerUp
