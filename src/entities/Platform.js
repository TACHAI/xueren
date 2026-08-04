// 雪人打怪兽 - 平台
// 静态/动态平台：玩家和敌人站立的地面

class Platform {
  /**
   * 创建平台
   * @param {number} x - 左上角 X 坐标
   * @param {number} y - 左上角 Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} id - 平台 ID
   */
  constructor(x, y, width, height, id) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.type = 'platform'

    // 动态移动参数（可选）
    this.moveRange = 0   // 移动范围
    this.moveSpeed = 0   // 移动速度
    this.moveDir = 1     // 移动方向
    this.baseX = x       // 基准位置
    this.baseY = y
  }

  /**
   * 更新平台位置（支持水平移动）
   * @param {number} dt - 帧间隔
   */
  update(dt) {
    if (this.moveRange > 0) {
      this.x += this.moveDir * this.moveSpeed * dt
      if (this.x > this.baseX + this.moveRange) {
        this.moveDir = -1
      } else if (this.x < this.baseX - this.moveRange) {
        this.moveDir = 1
      }
    }
  }

  /**
   * 渲染平台：圆角矩形 + 雪纹纹理
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    ctx.save()
    // 平台主体（浅灰色）
    ctx.fillStyle = '#e8e8e8'
    ctx.beginPath()
    const r = 6
    ctx.moveTo(this.x + r, this.y)
    ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + this.height, r)
    ctx.arcTo(this.x + this.width, this.y + this.height, this.x, this.y + this.height, r)
    ctx.arcTo(this.x, this.y + this.height, this.x, this.y, r)
    ctx.arcTo(this.x, this.y, this.x + this.width, this.y, r)
    ctx.closePath()
    ctx.fill()

    // 顶部阴影条
    ctx.fillStyle = '#d0d0d0'
    ctx.beginPath()
    ctx.moveTo(this.x, this.y + 4)
    ctx.lineTo(this.x + this.width, this.y + 4)
    ctx.lineTo(this.x + this.width, this.y + 8)
    ctx.lineTo(this.x, this.y + 8)
    ctx.closePath()
    ctx.fill()

    // 雪点纹理
    ctx.fillStyle = 'rgba(180, 200, 220, 0.5)'
    for (let i = 0; i < this.width; i += 20) {
      ctx.beginPath()
      ctx.arc(this.x + i + 10, this.y + 3, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /**
   * 获取碰撞矩形
   * @returns {{x:number, y:number, width:number, height:number}}
   */
  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }
}

module.exports = Platform
