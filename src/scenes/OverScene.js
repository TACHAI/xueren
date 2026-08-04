const DrawUtils = require('../utils/Draw')
const MathUtils = require('../utils/Math')

class OverScene {
  constructor(ctx, width, height, data) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.score = data.score || 0
    this.win = data.win || false
    this.time = 0
    this.btnBounds = null
    this.initButtons()
    this.particles = []
    this.initCelebrationParticles()
  }

  initButtons() {
    const btnWidth = 180
    const btnHeight = 52
    const centerX = this.width / 2

    this.btnBounds = {
      restart: {
        x: centerX - btnWidth / 2,
        y: this.height * 0.7 - btnHeight / 2,
        w: btnWidth,
        h: btnHeight,
        pressed: false
      },
      home: {
        x: centerX - btnWidth / 2,
        y: this.height * 0.7 - btnHeight / 2 + btnHeight + 16,
        w: btnWidth,
        h: btnHeight,
        pressed: false
      }
    }
  }

  initCelebrationParticles() {
    if (this.win) {
      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: -Math.random() * this.height,
          radius: MathUtils.randomRange(3, 6),
          vx: MathUtils.randomRange(-50, 50),
          vy: MathUtils.randomRange(50, 150),
          color: ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'][MathUtils.randomInt(0, 5)],
          alpha: 1,
          decay: MathUtils.randomRange(0.3, 0.6)
        })
      }
    }
  }

  update(dt) {
    this.time += dt
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 100 * dt
      p.alpha -= p.decay * dt
      if (p.alpha <= 0 || p.y > this.height + 10) {
        p.x = Math.random() * this.width
        p.y = -10
        p.alpha = 1
        p.vy = MathUtils.randomRange(50, 150)
      }
    }
  }

  render() {
    const ctx = this.ctx
    DrawUtils.drawBackground(ctx, this.width, this.height)

    for (const p of this.particles) {
      if (p.alpha > 0) {
        DrawUtils.drawParticle(ctx, p.x, p.y, p.radius, p.color, p.alpha)
      }
    }

    const emojiY = this.height * 0.28 + Math.sin(this.time * 3) * 10
    const emoji = this.win ? '☃️' : '❄️'
    DrawUtils.drawText(ctx, emoji, this.width / 2, emojiY, {
      color: '#ffffff',
      fontSize: 80,
      shadow: false
    })

    const resultText = this.win ? '胜利通关!' : '挑战失败'
    const resultColor = this.win ? '#2ecc71' : '#e74c3c'
    DrawUtils.drawText(ctx, resultText, this.width / 2, this.height * 0.4, {
      color: resultColor,
      fontSize: 48,
      bold: true
    })

    DrawUtils.drawText(ctx, `最终分数: ${this.score}`, this.width / 2, this.height * 0.5, {
      color: '#ffffff',
      fontSize: 28,
      bold: true
    })

    if (this.win) {
      const stars = Math.min(5, Math.floor(this.score / 100))
      let starText = ''
      for (let i = 0; i < 5; i++) {
        starText += i < stars ? '⭐' : '☆'
      }
      DrawUtils.drawText(ctx, starText, this.width / 2, this.height * 0.56, {
        color: '#f1c40f',
        fontSize: 32,
        shadow: false
      })
    }

    DrawUtils.drawButton(ctx,
      this.width / 2,
      this.btnBounds.restart.y + this.btnBounds.restart.h / 2,
      this.btnBounds.restart.w,
      this.btnBounds.restart.h,
      '再来一局',
      { bgColor: '#3498db', fontSize: 20, pressed: this.btnBounds.restart.pressed }
    )

    DrawUtils.drawButton(ctx,
      this.width / 2,
      this.btnBounds.home.y + this.btnBounds.home.h / 2,
      this.btnBounds.home.w,
      this.btnBounds.home.h,
      '返回首页',
      { bgColor: '#95a5a6', fontSize: 18, pressed: this.btnBounds.home.pressed }
    )
  }

  onTouchStart(touch, callback) {
    this.callback = callback
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.isInsideButton(x, y, this.btnBounds.restart)) {
      this.btnBounds.restart.pressed = true
      this.pressedButton = 'restart'
    } else if (this.isInsideButton(x, y, this.btnBounds.home)) {
      this.btnBounds.home.pressed = true
      this.pressedButton = 'home'
    }
  }

  onTouchMove(touch) {
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.pressedButton === 'restart') {
      this.btnBounds.restart.pressed = this.isInsideButton(x, y, this.btnBounds.restart)
    } else if (this.pressedButton === 'home') {
      this.btnBounds.home.pressed = this.isInsideButton(x, y, this.btnBounds.home)
    }
  }

  onTouchEnd(touch) {
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    if (this.pressedButton === 'restart' && this.isInsideButton(x, y, this.btnBounds.restart)) {
      this.callback && this.callback('scene:restart')
    } else if (this.pressedButton === 'home' && this.isInsideButton(x, y, this.btnBounds.home)) {
      this.callback && this.callback('scene:start')
    }
    this.btnBounds.restart.pressed = false
    this.btnBounds.home.pressed = false
    this.pressedButton = null
  }

  isInsideButton(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h
  }
}

module.exports = OverScene