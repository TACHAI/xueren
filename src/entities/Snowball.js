// 雪人打怪兽 - 雪球投掷物
// 玩家喷射的雪球：水平飞行，有生命周期，可被道具增大

class Snowball {
  /**
   * 创建雪球
   * @param {number} x - 初始 X 坐标
   * @param {number} y - 初始 Y 坐标
   * @param {number} vx - 水平速度
   * @param {number} vy - 垂直速度（当前不使用）
   * @param {number} radius - 半径（可被道具增大）
   */
  constructor(x, y, vx, vy, radius = 8) {
    this.x = x
    this.y = y
    this.vx = vx        // 水平速度（正向右，负向左）
    this.vy = 0         // 保持水平飞行
    this.radius = radius
    this.rotation = 0   // 自转角度
    this.life = 0       // 存活时间
    this.maxLife = 4    // 最大存活时间（秒）
    this.dead = false
  }

  /**
   * 更新雪球位置（每帧调用）
   * @param {number} dt - 帧间隔（秒）
   */
  update(dt) {
    this.life += dt
    // 超时销毁
    if (this.life > this.maxLife) {
      this.dead = true
      return
    }

    // 水平飞行 + 自转
    this.x += this.vx * dt
    this.rotation += this.vx * 0.015
  }

  /**
   * 渲染雪球
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    if (this.dead) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)

    const r = this.radius
    // 雪球主体（白色圆形）
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // 边缘描边
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.8)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 内圈阴影
    ctx.fillStyle = 'rgba(220, 230, 240, 0.7)'
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2)
    ctx.fill()

    // 高光
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * 获取碰撞圆
   * @returns {{x:number, y:number, radius:number}}
   */
  getHitCircle() {
    return { x: this.x, y: this.y, radius: this.radius }
  }
}

module.exports = Snowball
