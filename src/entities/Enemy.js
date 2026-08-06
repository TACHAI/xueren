// 雪人打怪兽 - 敌人角色
// 火焰恶魔敌人：支持行走、被雪球包裹、被推动、死亡等状态机

const MathUtils = require('../utils/Math')

// 敌人状态枚举
const STATE = {
  WALKING: 'walking',   // 行走中
  COVERED: 'covered',   // 被雪球包裹
  PUSHED: 'pushed',     // 被推动中（大雪球）
  DEAD: 'dead'          // 已死亡
}

class Enemy {
  /**
   * 创建敌人
   * @param {number} x - 初始 X 坐标
   * @param {number} y - 初始 Y 坐标
   * @param {Platform} platform - 所在平台（用于边缘检测）
   */
  constructor(x, y, platform) {
    // 位置和速度
    this.x = x
    this.y = y
    this.vx = -50
    this.vy = 0
    this.width = 36
    this.height = 50

    // 状态管理
    this.state = STATE.WALKING
    this.snowCoverage = 0   // 被雪球命中的次数
    this.maxCoverage = 3    // 达到此数变为大雪球
    this.platform = platform

    // 融化机制参数
    this.coverTime = 0          // 被冻住后经过的时间
    this.meltStartTime = 5      // 5秒后开始融化
    this.meltCompleteTime = 7   // 7秒完全融化

    // 参数
    this.walkSpeed = 50
    this.pushSpeed = 300
    this.direction = Math.random() < 0.5 ? -1 : 1  // 随机初始方向

    // 动画参数
    this.animTime = 0
    this.wobble = 0
    this.deathAnim = 0
  }

  /**
   * 更新敌人状态（每帧调用）
   * @param {number} dt - 帧间隔（秒）
   * @param {Array} platforms - 平台数组
   * @param {Player} player - 玩家（用于检测推球）
   * @param {Array} pushBalls - 其他推动中的敌人（保留接口）
   */
  update(dt, platforms, player, pushBalls) {
    this.animTime += dt

    // 根据状态执行不同逻辑
    switch (this.state) {
      case STATE.WALKING:
        this.updateWalking(dt)
        break
      case STATE.COVERED:
        this.updateCovered(dt, player, platforms)
        break
      case STATE.PUSHED:
        this.updatePushed(dt, platforms)
        break
      case STATE.DEAD:
        this.deathAnim -= dt
        break
    }

    // 应用重力和位置更新
    this.vy += 1200 * dt
    this.y += this.vy * dt
    this.x += this.vx * dt

    // 地面碰撞
    this.handleGroundCollision(platforms)
  }

  /**
   * 行走状态更新：左右巡逻，检测平台边缘
   * @param {number} dt - 帧间隔
   */
  updateWalking(dt) {
    this.wobble += dt * 8
    this.vx = this.direction * this.walkSpeed
    this.checkPlatformEdge()
  }

  /**
   * 检测是否到达平台边缘，到达则反向
   */
  checkPlatformEdge() {
    if (!this.platform) return
    const rect = this.platform.getRect()
    const nextX = this.x + this.direction * this.width / 2 + 5
    if (nextX < rect.x || nextX > rect.x + rect.width) {
      this.direction *= -1
      this.vx = this.direction * this.walkSpeed
    }
  }

  /**
   * 被雪球包裹状态：静止，检测玩家靠近以触发推动
   * 5秒后开始融化，7秒完全融化恢复行走
   * @param {number} dt - 帧间隔
   * @param {Player} player - 玩家
   * @param {Array} platforms - 平台数组
   */
  updateCovered(dt, player, platforms) {
    this.wobble += dt * 4
    this.vx = 0

    // 累加冻住时间
    this.coverTime += dt

    // 7秒完全融化，恢复行走状态
    if (this.coverTime >= this.meltCompleteTime) {
      this.state = STATE.WALKING
      this.snowCoverage = 0
      this.coverTime = 0
      // 融化后短暂无敌避免立即被再次冻住
      return
    }

    // 检测玩家靠近以触发推动（仅在前5秒未融化时）
    if (player && this.coverTime < this.meltStartTime) {
      const dx = this.x - player.x
      const dy = Math.abs(this.y - player.y)
      const dist = Math.abs(dx)
      // 玩家靠近则变为推动状态
      if (dist < 60 && dy < 60) {
        this.direction = dx >= 0 ? 1 : -1
        this.state = STATE.PUSHED
        this.vx = this.direction * this.pushSpeed
      }
    }
  }

  /**
   * 获取当前融化进度（0-1，0=未融化，1=完全融化）
   * @returns {number}
   */
  getMeltProgress() {
    if (this.state !== STATE.COVERED) return 0
    if (this.coverTime < this.meltStartTime) return 0
    return Math.min(1, (this.coverTime - this.meltStartTime) /
      (this.meltCompleteTime - this.meltStartTime))
  }

  /**
   * 推动状态：高速滚动，掉出屏幕则死亡
   * @param {number} dt - 帧间隔
   * @param {Array} platforms - 平台数组
   */
  updatePushed(dt, platforms) {
    this.wobble += dt * 15
    this.vx = this.direction * this.pushSpeed

    // 掉出屏幕底部则销毁
    if (this.y + this.height / 2 > 2000) {
      this.state = STATE.DEAD
      this.deathAnim = 0.3
    }
  }

  /**
   * 处理地面碰撞（从上方落到平台）
   * @param {Array} platforms - 平台数组
   */
  handleGroundCollision(platforms) {
    for (const platform of platforms) {
      if (!platform) continue
      const rect = platform.getRect()
      const bottom = this.y + this.height / 2
      const left = this.x - this.width / 2
      const right = this.x + this.width / 2

      if (right > rect.x && left < rect.x + rect.width) {
        if (this.vy >= 0 && bottom > rect.y && bottom - this.vy * 0.016 <= rect.y + 10) {
          this.y = rect.y - this.height / 2
          this.vy = 0
          // 更新所在平台引用
          if (this.state === STATE.WALKING || this.state === STATE.COVERED) {
            this.platform = platform
          }
        }
      }
    }
  }

  /**
   * 被雪球命中，增加雪层
   * @returns {boolean} 是否达到最大覆盖（变成大雪球）
   */
  addSnowLayer() {
    this.snowCoverage = Math.min(this.maxCoverage, this.snowCoverage + 1)
    if (this.snowCoverage >= this.maxCoverage && this.state === STATE.WALKING) {
      this.state = STATE.COVERED
      this.vx = 0
      this.wobble = 0
      this.coverTime = 0  // 重置冻住计时器
      return true
    }
    return false
  }

  /**
   * 检查是否已死亡
   * @returns {boolean}
   */
  isDead() {
    return this.state === STATE.DEAD
  }

  /**
   * 被推球撞死
   */
  die() {
    this.state = STATE.DEAD
    this.deathAnim = 0.5
    this.vx = 0
    this.vy = -300
  }

  /**
   * 渲染敌人
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 死亡动画淡出
    const alpha = this.state === STATE.DEAD ? Math.max(0, this.deathAnim / 0.5) : 1
    if (alpha <= 0) return

    ctx.save()
    ctx.globalAlpha = alpha

    // 根据状态选择渲染方式
    switch (this.state) {
      case STATE.WALKING:
        this.renderWalking(ctx)
        break
      case STATE.COVERED:
        this.renderCovered(ctx)
        break
      case STATE.PUSHED:
        this.renderPushed(ctx)
        break
      case STATE.DEAD:
        this.renderDead(ctx)
        break
    }

    ctx.restore()
  }

  /**
   * 渲染行走状态：火焰恶魔形象
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderWalking(ctx) {
    const wobble = Math.sin(this.wobble) * 0.05
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(wobble)
    ctx.scale(this.direction, 1)  // 根据方向翻转

    // 身体（深红色圆形）
    ctx.shadowColor = '#ff4500'
    ctx.shadowBlur = 15
    ctx.fillStyle = '#c0392b'
    ctx.strokeStyle = '#922b21'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 15, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 身体纹理斑点
    ctx.fillStyle = '#e74c3c'
    ctx.beginPath()
    ctx.arc(-8, 10, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, 18, 5, 0, Math.PI * 2)
    ctx.fill()

    // 头部（橙红色）
    ctx.fillStyle = '#d35400'
    ctx.strokeStyle = '#a04000'
    ctx.beginPath()
    ctx.arc(0, -15, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = 'transparent'

    // 犄角（深色三角）
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.moveTo(-12, -32)
    ctx.lineTo(-18, -45)
    ctx.lineTo(-8, -35)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#1a252f'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(12, -32)
    ctx.lineTo(18, -45)
    ctx.lineTo(8, -35)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 眼睛（发光红色）
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(-7, -18, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(7, -18, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // 眼睛高光
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(-5, -19, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(9, -19, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // 獠牙
    ctx.fillStyle = '#ecf0f1'
    ctx.strokeStyle = '#bdc3c7'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-4, -8)
    ctx.lineTo(-2, -3)
    ctx.lineTo(-1, -8)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(4, -8)
    ctx.lineTo(2, -3)
    ctx.lineTo(1, -8)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 嘴巴（弧形微笑）
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-6, -10)
    ctx.quadraticCurveTo(0, -5, 6, -10)
    ctx.stroke()

    // 尾巴（带火焰效果）
    ctx.strokeStyle = '#c0392b'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-20, 20)
    ctx.quadraticCurveTo(-30, 10, -25 + Math.sin(this.wobble * 2) * 5, 5)
    ctx.stroke()

    // 尾巴尖火焰（双层）
    ctx.fillStyle = '#ff6b35'
    ctx.beginPath()
    ctx.arc(-28, 5 + Math.sin(this.wobble * 2) * 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffcc02'
    ctx.beginPath()
    ctx.arc(-28, 5 + Math.sin(this.wobble * 2) * 3, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * 渲染被雪球包裹状态（含融化动画）
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderCovered(ctx) {
    const wobble = Math.sin(this.wobble) * 0.1
    const meltProgress = this.getMeltProgress()  // 0-1
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(wobble)

    // 融化时的缩放因子（雪球随融化缩小）
    const snowScale = 1 - meltProgress * 0.4
    // 融化时透明度降低
    const snowAlpha = 1 - meltProgress * 0.6

    // 基础身体（红色底色，融化时逐渐显露）
    const bodyAlpha = 0.5 + meltProgress * 0.5
    ctx.globalAlpha = bodyAlpha
    ctx.fillStyle = '#c0392b'
    ctx.beginPath()
    ctx.arc(0, 15, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // 雪球逐渐包裹（根据覆盖率变化大小，融化时缩小）
    const coverageRatio = this.snowCoverage / this.maxCoverage
    ctx.globalAlpha = snowAlpha

    // 融化时产生水滴效果
    if (meltProgress > 0) {
      ctx.fillStyle = 'rgba(150, 200, 230, 0.7)'
      for (let i = 0; i < 4; i++) {
        const dropAngle = (this.animTime * 2 + i * Math.PI / 2) % (Math.PI * 2)
        const dropR = 20 + Math.sin(this.animTime * 3 + i) * 5
        const dropX = Math.cos(dropAngle) * dropR
        const dropY = Math.sin(dropAngle) * dropR + meltProgress * 15
        const dropSize = 2 + meltProgress * 2
        ctx.beginPath()
        ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 15 - coverageRatio * 20, (24 + coverageRatio * 5) * snowScale, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, -15, (20 + coverageRatio * 4) * snowScale, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(200, 200, 220, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 犄角露在外面（火焰恶魔标志）
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.moveTo(-12, -32)
    ctx.lineTo(-18, -45)
    ctx.lineTo(-8, -35)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(12, -32)
    ctx.lineTo(18, -45)
    ctx.lineTo(8, -35)
    ctx.closePath()
    ctx.fill()

    // 旋转雪花装饰（融化时消失）
    if (meltProgress < 1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - meltProgress)})`
      for (let i = 0; i < 3; i++) {
        const angle = (this.animTime * 3 + i * Math.PI * 2 / 3) % (Math.PI * 2)
        const sx = Math.cos(angle) * (20 + coverageRatio * 4) * snowScale
        const sy = Math.sin(angle) * (20 + coverageRatio * 4) * snowScale
        ctx.beginPath()
        ctx.arc(sx, sy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1
    ctx.restore()
  }

  /**
   * 渲染推动状态：旋转的大雪球
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderPushed(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.animTime * 10 * this.direction)

    // 雪球主体
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(200, 210, 220, 0.8)'
    ctx.beginPath()
    ctx.arc(0, 0, 28, 0, Math.PI * 2)
    ctx.stroke()

    // 雪球纹路
    ctx.strokeStyle = 'rgba(200, 210, 220, 0.6)'
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20)
      ctx.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30)
      ctx.stroke()
    }

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(-8, -8, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * 渲染死亡状态：淡出消失
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderDead(ctx) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, this.deathAnim / 0.5)
    ctx.translate(this.x, this.y)
    ctx.scale(0.5, 0.5)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
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
   * 获取圆形碰撞范围
   * @returns {{x:number, y:number, radius:number}}
   */
  getHitCircle() {
    const r = this.state === STATE.PUSHED ? 35 : 25
    return { x: this.x, y: this.y, radius: r }
  }
}

Enemy.STATE = STATE
module.exports = Enemy
