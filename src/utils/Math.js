// 雪人打怪兽 - 数学工具
// 提供常用的数学函数：clamp、lerp、距离、角度、随机数等

const MathUtils = {
  /**
   * 限制值在指定范围内
   * @param {number} value - 输入值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  },

  /**
   * 线性插值
   * @param {number} a - 起始值
   * @param {number} b - 目标值
   * @param {number} t - 插值系数（0-1）
   * @returns {number}
   */
  lerp(a, b, t) {
    return a + (b - a) * t
  },

  /**
   * 计算两点距离
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {number}
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  },

  /**
   * 计算两点间角度
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {number} 弧度
   */
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1)
  },

  /**
   * 生成指定范围内的随机浮点数
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomRange(min, max) {
    return Math.random() * (max - min) + min
  },

  /**
   * 生成指定范围内的随机整数
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  /**
   * 按概率返回 true
   * @param {number} probability - 概率（0-1）
   * @returns {boolean}
   */
  chance(probability) {
    return Math.random() < probability
  },

  /**
   * 计算抛体运动轨迹点（用于瞄准线预测）
   * @param {number} startX - 起始 X
   * @param {number} startY - 起始 Y
   * @param {number} vx - 水平速度
   * @param {number} vy - 垂直速度
   * @param {number} gravity - 重力加速度
   * @param {number} steps - 轨迹点数量
   * @param {number} dt - 时间步长
   * @returns {Array<{x:number, y:number}>}
   */
  getTrajectory(startX, startY, vx, vy, gravity, steps, dt) {
    const points = []
    let x = startX
    let y = startY
    let cvx = vx
    let cvy = vy
    for (let i = 0; i < steps; i++) {
      points.push({ x, y })
      cvy += gravity * dt
      x += cvx * dt
      y += cvy * dt
    }
    return points
  }
}

module.exports = MathUtils
