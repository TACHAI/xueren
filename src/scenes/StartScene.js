const DrawUtils = require('../utils/Draw')
const MathUtils = require('../utils/Math')

class StartScene {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.title = '雪人打怪兽'
    this.subtitle = 'Snowman vs Monsters'
    this.particles = []
    this.time = 0
    this.btnPressed = false
    this.btnBounds = null
    this.showHelp = false
    this.helpDismiss = false
    this.helpAnim = 0
    this.initSnowflakes()
    this.initButtons()
  }

  initSnowflakes() {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: MathUtils.randomRange(1, 3),
        speed: MathUtils.randomRange(20, 60),
        drift: MathUtils.randomRange(-15, 15),
        alpha: MathUtils.randomRange(0.3, 0.8)
      })
    }
  }

  initButtons() {
    const btnWidth = 200
    const btnHeight = 56
    const centerX = this.width / 2

    this.btnBounds = {
      start: {
        x: centerX - btnWidth / 2,
        y: this.height * 0.65 - btnHeight / 2,
        w: btnWidth,
        h: btnHeight,
        pressed: false
      },
      help: {
        x: centerX - btnWidth / 2,
        y: this.height * 0.65 - btnHeight / 2 + btnHeight + 20,
        w: btnWidth,
        h: btnHeight,
        pressed: false
      }
    }
  }

  update(dt) {
    this.time += dt
    if (this.showHelp && this.helpAnim < 1) {
      this.helpAnim = Math.min(1, this.helpAnim + dt * 4)
    }
    for (const p of this.particles) {
      p.y += p.speed * dt
      p.x += p.drift * dt
      if (p.y > this.height + 5) {
        p.y = -5
        p.x = Math.random() * this.width
      }
      if (p.x < -5) p.x = this.width + 5
      if (p.x > this.width + 5) p.x = -5
    }
  }

  render() {
    const ctx = this.ctx
    DrawUtils.drawBackground(ctx, this.width, this.height)

    for (const p of this.particles) {
      DrawUtils.drawParticle(ctx, p.x, p.y, p.radius, '#ffffff', p.alpha)
    }

    const snowmanY = this.height * 0.38 + Math.sin(this.time * 2) * 8
    DrawUtils.drawSnowman(ctx, this.width / 2, snowmanY, 1, { isEnemy: false, wobble: Math.sin(this.time * 1.5) * 0.03 })

    const titleAlpha = Math.min(1, this.time * 2)
    DrawUtils.drawText(ctx, this.title, this.width / 2, this.height * 0.15, {
      color: '#ffffff',
      fontSize: 56,
      bold: true,
      alpha: titleAlpha,
      shadow: true
    })

    DrawUtils.drawText(ctx, this.subtitle, this.width / 2, this.height * 0.15 + 50, {
      color: '#e8f4ff',
      fontSize: 20,
      alpha: titleAlpha * 0.8
    })

    DrawUtils.drawButton(ctx,
      this.width / 2,
      this.btnBounds.start.y + this.btnBounds.start.h / 2,
      this.btnBounds.start.w,
      this.btnBounds.start.h,
      '开始游戏',
      { bgColor: '#3498db', fontSize: 22, pressed: this.btnBounds.start.pressed }
    )

    DrawUtils.drawButton(ctx,
      this.width / 2,
      this.btnBounds.help.y + this.btnBounds.help.h / 2,
      this.btnBounds.help.w,
      this.btnBounds.help.h,
      '玩法说明',
      { bgColor: '#2ecc71', fontSize: 20, pressed: this.btnBounds.help.pressed }
    )

    DrawUtils.drawText(ctx, '移动 · 跳跃 · 喷射雪球 · 推球消灭', this.width / 2, this.height - 40, {
      color: '#ffffff',
      fontSize: 14,
      alpha: 0.7
    })

    if (this.showHelp) {
      this.drawHelp(ctx)
    }
  }

  drawHelp(ctx) {
    const a = this.helpAnim
    ctx.save()
    ctx.globalAlpha = a

    ctx.fillStyle = 'rgba(0,0,0,0.82)'
    ctx.fillRect(0, 0, this.width, this.height)

    const panelW = this.width * 0.86
    const panelH = this.height * 0.72
    const panelX = (this.width - panelW) / 2
    const panelY = (this.height - panelH) / 2

    ctx.fillStyle = 'rgba(40, 60, 90, 0.95)'
    DrawUtils.roundRectPath(ctx, panelX, panelY, panelW, panelH, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.stroke()

    DrawUtils.drawText(ctx, '玩法说明', this.width / 2, panelY + 36, {
      color: '#f1c40f',
      fontSize: 26,
      bold: true,
      shadow: false
    })

    const colX = this.width / 2
    const topY = panelY + 70

    // --- 左列：操作图示 ---
    const leftX = panelX + panelW * 0.27
    const rightX = panelX + panelW * 0.73

    // 操作区标题
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText('操作', leftX, topY)
    ctx.fillText('目标', rightX, topY)

    // 左列图示
    const items = [
      { icon: '← →', label: '左右移动', desc: '避开敌人' },
      { icon: '跳', label: '跳跃', desc: '上平台' },
      { icon: '射', label: '喷射雪球', desc: '击中敌人' },
    ]
    for (let i = 0; i < items.length; i++) {
      const y = topY + 35 + i * 78
      // 图标圆
      ctx.fillStyle = '#34495e'
      ctx.beginPath()
      ctx.arc(leftX, y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ecf0f1'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(items[i].icon, leftX, y)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(items[i].label, leftX, y + 30)
      ctx.fillStyle = '#95a5a6'
      ctx.font = '12px sans-serif'
      ctx.fillText(items[i].desc, leftX, y + 48)
    }

    // --- 右列：目标图示 ---
    const goalItems = [
      { icon: '❄', label: '3次命中', desc: '敌人变雪球' },
      { icon: '→', label: '推动雪球', desc: '撞死其他敌人' },
      { icon: '★', label: '消灭全部', desc: '通关' },
    ]
    for (let i = 0; i < goalItems.length; i++) {
      const y = topY + 35 + i * 78
      ctx.fillStyle = '#8e44ad'
      ctx.beginPath()
      ctx.arc(rightX, y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ecf0f1'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(goalItems[i].icon, rightX, y)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(goalItems[i].label, rightX, y + 30)
      ctx.fillStyle = '#95a5a6'
      ctx.font = '12px sans-serif'
      ctx.fillText(goalItems[i].desc, rightX, y + 48)
    }

    // --- 下方：道具和关卡 ---
    const bottomY = panelY + panelH - 115
    ctx.fillStyle = '#f1c40f'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('道具系统（通关后随机获得）', colX, bottomY)

    const powerY = bottomY + 26
    const powers = [
      { icon: '❄', color: '#3498db', name: '巨雪球', unlock: '第3关起' },
      { icon: '⚡', color: '#e74c3c', name: '速射', unlock: '第4关起' },
      { icon: '✦', color: '#27ae60', name: '疾风', unlock: '第5关起' },
    ]
    const pw = 68
    const totalW = pw * powers.length + 12 * (powers.length - 1)
    const startX = colX - totalW / 2 + pw / 2
    for (let i = 0; i < powers.length; i++) {
      const x = startX + i * (pw + 12)
      ctx.fillStyle = powers[i].color
      DrawUtils.roundRectPath(ctx, x - pw / 2, powerY - 24, pw, 48, 10)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(powers[i].icon + powers[i].name, x, powerY - 6)
      ctx.fillStyle = '#ffffff'
      ctx.font = '11px sans-serif'
      ctx.fillText(powers[i].unlock, x, powerY + 12)
    }

    DrawUtils.drawText(ctx, '共 8 关 · 难度递增', colX, panelY + panelH - 55, {
      color: '#bdc3c7',
      fontSize: 13,
      shadow: false
    })

    const hintAlpha = 0.5 + Math.sin(this.time * 4) * 0.3
    DrawUtils.drawText(ctx, '点击任意位置关闭', colX, panelY + panelH - 28, {
      color: '#ffffff',
      fontSize: 14,
      alpha: hintAlpha * a,
      shadow: false
    })

    ctx.restore()
  }

  onTouchStart(touch, callback) {
    this.callback = callback
    if (this.showHelp) {
      this.helpDismiss = true
      return
    }
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.isInsideButton(x, y, this.btnBounds.start)) {
      this.btnBounds.start.pressed = true
      this.pressedButton = 'start'
    } else if (this.isInsideButton(x, y, this.btnBounds.help)) {
      this.btnBounds.help.pressed = true
      this.pressedButton = 'help'
    }
  }

  onTouchMove(touch) {
    if (this.showHelp) return
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.pressedButton === 'start') {
      this.btnBounds.start.pressed = this.isInsideButton(x, y, this.btnBounds.start)
    } else if (this.pressedButton === 'help') {
      this.btnBounds.help.pressed = this.isInsideButton(x, y, this.btnBounds.help)
    }
  }

  onTouchEnd(touch) {
    if (this.showHelp) {
      if (this.helpDismiss) {
        this.showHelp = false
        this.helpDismiss = false
        this.helpAnim = 0
      }
      return
    }
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.pressedButton === 'start' && this.isInsideButton(x, y, this.btnBounds.start)) {
      this.callback && this.callback('game:start')
    } else if (this.pressedButton === 'help' && this.isInsideButton(x, y, this.btnBounds.help)) {
      this.showHelp = true
      this.helpAnim = 0
    }
    this.btnBounds.start.pressed = false
    this.btnBounds.help.pressed = false
    this.pressedButton = null
  }

  isInsideButton(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h
  }
}

module.exports = StartScene