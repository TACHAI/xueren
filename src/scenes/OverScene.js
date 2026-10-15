const DrawUtils = require('../utils/Draw')
const MathUtils = require('../utils/Math')

class OverScene {
  constructor(ctx, width, height, data) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.score = data.score || 0
    this.win = data.win || false
    this.totalTime = data.time || 0 // 整局游戏总耗时（秒）

    // 通关彩蛋：按总耗时评定称号；5 分钟内通关额外发放激活码
    this.title = ''
    this.activationCode = null
    if (this.win) {
      if (this.totalTime <= 300) {
        this.title = '超级无敌怪兽杀手'
        this.activationCode = this.generateActivationCode()
      } else if (this.totalTime <= 480) {
        this.title = '超级怪兽杀手'
      } else {
        this.title = '怪兽杀手'
      }
    }
    this.time = 0
    this.btnBounds = null
    this.initButtons()
    this.particles = []
    this.initCelebrationParticles()
  }

  /**
   * 生成 8 位激活码：前 2 位随机大写字母 + 后 6 位当天日期（年份末两位+月份+日期），如 FH260928
   * @returns {string}
   */
  generateActivationCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const prefix = letters[MathUtils.randomInt(0, 25)] + letters[MathUtils.randomInt(0, 25)]
    const now = new Date()
    const yy = (now.getFullYear() % 100).toString().padStart(2, '0')
    const mm = (now.getMonth() + 1).toString().padStart(2, '0')
    const dd = now.getDate().toString().padStart(2, '0')
    return `${prefix}${yy}${mm}${dd}`
  }

  initButtons() {
    const btnWidth = 180
    const btnHeight = 52
    const centerX = this.width / 2
    // 通关界面内容更多，按钮整体下移
    const baseY = this.height * (this.win ? 0.8 : 0.7)

    this.btnBounds = {
      restart: {
        x: centerX - btnWidth / 2,
        y: baseY - btnHeight / 2,
        w: btnWidth,
        h: btnHeight,
        pressed: false
      },
      home: {
        x: centerX - btnWidth / 2,
        y: baseY - btnHeight / 2 + btnHeight + 16,
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

    const emojiY = this.height * (this.win ? 0.19 : 0.28) + Math.sin(this.time * 3) * 10
    const emoji = this.win ? '☃️' : '❄️'
    DrawUtils.drawText(ctx, emoji, this.width / 2, emojiY, {
      color: '#ffffff',
      fontSize: 80,
      shadow: false
    })

    const resultText = this.win ? '胜利通关!' : '挑战失败'
    const resultColor = this.win ? '#2ecc71' : '#e74c3c'
    DrawUtils.drawText(ctx, resultText, this.width / 2, this.height * (this.win ? 0.28 : 0.4), {
      color: resultColor,
      fontSize: 48,
      bold: true
    })

    // 通关彩蛋：称号展示（去掉前缀，避免加长后溢出屏宽）
    if (this.win) {
      DrawUtils.drawText(ctx, this.title, this.width / 2, this.height * 0.35, {
        color: '#f1c40f',
        fontSize: 26,
        bold: true
      })
    }

    DrawUtils.drawText(ctx, `最终分数: ${this.score}`, this.width / 2, this.height * (this.win ? 0.42 : 0.5), {
      color: '#ffffff',
      fontSize: 28,
      bold: true
    })

    // 整局总耗时（mm:ss）
    const tMinutes = Math.floor(this.totalTime / 60)
    const tSeconds = Math.floor(this.totalTime % 60)
    const totalTimeStr = `${tMinutes.toString().padStart(2, '0')}:${tSeconds.toString().padStart(2, '0')}`
    DrawUtils.drawText(ctx, `总耗时: ${totalTimeStr}`, this.width / 2, this.height * (this.win ? 0.47 : 0.555), {
      color: '#f1c40f',
      fontSize: 22,
      bold: true
    })

    if (this.win) {
      const stars = Math.min(5, Math.floor(this.score / 100))
      let starText = ''
      for (let i = 0; i < 5; i++) {
        starText += i < stars ? '⭐' : '☆'
      }
      DrawUtils.drawText(ctx, starText, this.width / 2, this.height * 0.53, {
        color: '#f1c40f',
        fontSize: 32,
        shadow: false
      })

      // 截图分享提示
      DrawUtils.drawText(ctx, '截图保存，分享到朋友圈!', this.width / 2, this.height * 0.59, {
        color: '#ffffff',
        fontSize: 16,
        bold: true
      })

      // 5 分钟内通关：展示激活码及兑换提示
      if (this.activationCode) {
        // 激活码区域半透明底板（避免白字叠在雪地背景上看不清）
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        DrawUtils.roundRectPath(ctx, this.width * 0.06, this.height * 0.62, this.width * 0.88, this.height * 0.135, 12)
        ctx.fill()
        ctx.restore()

        DrawUtils.drawText(ctx, `激活码: ${this.activationCode}`, this.width / 2, this.height * 0.655, {
          color: '#2ecc71',
          fontSize: 28,
          bold: true
        })
        DrawUtils.drawText(ctx, '发送激活码至邮箱: tc1206966083@gmail.com', this.width / 2, this.height * 0.70, {
          color: '#ffffff',
          fontSize: 13
        })
        DrawUtils.drawText(ctx, '您将成为下一个游戏的内测玩家', this.width / 2, this.height * 0.735, {
          color: '#f1c40f',
          fontSize: 13,
          bold: true
        })
      }
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