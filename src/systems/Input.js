// 雪人打怪兽 - 输入系统
// 虚拟按键控制：左、右、跳、射

const DrawUtils = require('../utils/Draw')

class InputSystem {
  constructor() {
    // 按键状态
    this.left = false
    this.right = false
    this.jump = false
    this.shoot = false

    // 按钮位置配置
    this.buttons = {
      left: null,
      right: null,
      jump: null,
      shoot: null
    }

    // 触摸映射（支持多点触控）
    this.touchMap = {}
  }

  /**
   * 根据屏幕尺寸设置按钮位置
   * @param {number} width - 屏幕宽度
   * @param {number} height - 屏幕高度
   */
  setupButtons(width, height) {
    const btnSize = 70
    const margin = 28
    const bottomY = height - margin - btnSize / 2

    // 左按钮（左下角）
    this.buttons.left = {
      x: margin + btnSize / 2,
      y: bottomY,
      width: btnSize,
      height: btnSize
    }

    // 右按钮（左按钮右侧）
    this.buttons.right = {
      x: margin + btnSize / 2 + btnSize + 15,
      y: bottomY,
      width: btnSize,
      height: btnSize
    }

    // 跳跃按钮（右下角偏左）
    this.buttons.jump = {
      x: width - margin - btnSize * 1.5 - 15,
      y: bottomY,
      width: btnSize,
      height: btnSize
    }

    // 射击按钮（跳跃按钮上方）
    this.buttons.shoot = {
      x: width - margin - btnSize / 2,
      y: bottomY - 55,
      width: btnSize,
      height: btnSize
    }
  }

  /**
   * 获取当前输入状态
   * @returns {{left:boolean, right:boolean, jump:boolean, shoot:boolean}}
   */
  getInput() {
    return {
      left: this.left,
      right: this.right,
      jump: this.jump,
      shoot: this.shoot
    }
  }

  /**
   * 触摸开始事件
   * @param {object} touch - 触摸对象
   */
  onTouchStart(touch) {
    // 兼容微信小游戏的触摸坐标
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y

    // 检测点击了哪个按钮
    if (this.isInside(x, y, this.buttons.left)) {
      this.left = true
      this.touchMap[touch.identifier || 0] = 'left'
    } else if (this.isInside(x, y, this.buttons.right)) {
      this.right = true
      this.touchMap[touch.identifier || 0] = 'right'
    } else if (this.isInside(x, y, this.buttons.jump)) {
      this.jump = true
      this.touchMap[touch.identifier || 0] = 'jump'
    } else if (this.isInside(x, y, this.buttons.shoot)) {
      this.shoot = true
      this.touchMap[touch.identifier || 0] = 'shoot'
    }
  }

  /**
   * 触摸移动事件（手指滑出按钮时释放）
   * @param {object} touch - 触摸对象
   */
  onTouchMove(touch) {
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    const id = touch.identifier || 0

    if (this.touchMap[id]) {
      const btn = this.touchMap[id]
      // 手指移出按钮范围则释放
      if (!this.isInside(x, y, this.buttons[btn])) {
        this[btn] = false
        delete this.touchMap[id]
      }
    }
  }

  /**
   * 触摸结束事件
   * @param {object} touch - 触摸对象
   */
  onTouchEnd(touch) {
    const id = touch.identifier || 0
    if (this.touchMap[id]) {
      const btn = this.touchMap[id]
      this[btn] = false
      delete this.touchMap[id]
    }
  }

  /**
   * 释放所有按键
   */
  releaseAll() {
    this.left = false
    this.right = false
    this.jump = false
    this.shoot = false
    this.touchMap = {}
  }

  /**
   * 检查点是否在按钮内
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {object} btn - 按钮配置
   * @returns {boolean}
   */
  isInside(x, y, btn) {
    if (!btn) return false
    return x >= btn.x - btn.width / 2 &&
           x <= btn.x + btn.width / 2 &&
           y >= btn.y - btn.height / 2 &&
           y <= btn.y + btn.height / 2
  }

  /**
   * 渲染虚拟按键
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    ctx.save()
    ctx.globalAlpha = 0.6

    this.drawButton(ctx, this.buttons.left, '←', this.left)
    this.drawButton(ctx, this.buttons.right, '→', this.right)
    this.drawButton(ctx, this.buttons.jump, '跳', this.jump)
    this.drawButton(ctx, this.buttons.shoot, '射', this.shoot)

    ctx.restore()
  }

  /**
   * 绘制单个按钮
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {object} btn - 按钮配置
   * @param {string} text - 按钮文字
   * @param {boolean} pressed - 是否按下
   */
  drawButton(ctx, btn, text, pressed) {
    if (!btn) return

    // 圆形按钮背景
    ctx.fillStyle = pressed ? '#3498db' : 'rgba(52, 152, 219, 0.5)'
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, btn.width / 2, 0, Math.PI * 2)
    ctx.fill()

    // 白色边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 3
    ctx.stroke()

    // 按钮文字
    ctx.fillStyle = '#ffffff'
    DrawUtils.setFont(ctx, 24, true)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, Math.round(btn.x), Math.round(btn.y))
  }
}

module.exports = InputSystem
