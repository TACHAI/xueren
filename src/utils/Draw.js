const DrawUtils = {
  drawSnowman(ctx, x, y, scale = 1, options = {}) {
    const {
      bodyColor = '#ffffff',
      shadowColor = 'rgba(0,0,0,0.15)',
      scarfColor = options.isEnemy ? '#e74c3c' : '#3498db',
      hasAngryBrows = !!options.isEnemy,
      wobble = 0,
      facing = 1
    } = options

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(wobble)
    ctx.scale(scale * facing, scale)

    ctx.shadowColor = shadowColor
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 8

    ctx.fillStyle = bodyColor
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth = 2

    // 身体（大球）
    ctx.beginPath()
    ctx.arc(0, 25, 45, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 头部（小球）
    ctx.beginPath()
    ctx.arc(0, -35, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = 'transparent'

    // 围巾
    ctx.fillStyle = scarfColor
    ctx.beginPath()
    ctx.moveTo(-28, -10)
    ctx.quadraticCurveTo(0, 0, 28, -10)
    ctx.lineTo(26, -5)
    ctx.quadraticCurveTo(0, 5, -26, -5)
    ctx.closePath()
    ctx.fill()

    // 围巾尾巴
    ctx.beginPath()
    ctx.moveTo(22, -8)
    ctx.lineTo(32, 8)
    ctx.lineTo(26, 10)
    ctx.lineTo(18, -4)
    ctx.closePath()
    ctx.fill()

    // 眼睛
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.arc(-10, -38, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, -38, 4, 0, Math.PI * 2)
    ctx.fill()

    // 敌人怒眉
    if (hasAngryBrows) {
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-18, -48)
      ctx.lineTo(-4, -43)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(18, -48)
      ctx.lineTo(4, -43)
      ctx.stroke()
    }

    // 胡萝卜鼻子
    ctx.fillStyle = '#e67e22'
    ctx.beginPath()
    ctx.moveTo(0, -32)
    ctx.lineTo(16, -28)
    ctx.lineTo(0, -26)
    ctx.closePath()
    ctx.fill()

    // 树枝手臂
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-28, 15)
    ctx.lineTo(-42, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-42, 0)
    ctx.lineTo(-47, -5)
    ctx.moveTo(-42, 0)
    ctx.lineTo(-37, -8)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(28, 15)
    ctx.lineTo(42, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(42, 0)
    ctx.lineTo(47, -5)
    ctx.moveTo(42, 0)
    ctx.lineTo(37, -8)
    ctx.stroke()

    // 纽扣
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.arc(-5, 35, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(5, 28, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(-5, 20, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  },

  drawSnowball(ctx, x, y, radius, rotation = 0, alpha = 1) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.7, '#f0f8ff')
    gradient.addColorStop(1, '#c8d8e8')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(150,170,190,0.4)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath()
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  },

  drawBackground(ctx, width, height) {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height)
    skyGradient.addColorStop(0, '#87CEEB')
    skyGradient.addColorStop(0.5, '#B0E0E6')
    skyGradient.addColorStop(0.7, '#E0F0FF')
    skyGradient.addColorStop(1, '#FFFFFF')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    for (let i = 0; i < 5; i++) {
      const x = (i * width / 4 + 50) % width
      const y = 80 + i * 30
      this.drawCloud(ctx, x, y, 40 + i * 5)
    }

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(0, height * 0.75)
    ctx.quadraticCurveTo(width * 0.3, height * 0.65, width * 0.5, height * 0.72)
    ctx.quadraticCurveTo(width * 0.7, height * 0.78, width, height * 0.7)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#f8f8ff'
    ctx.beginPath()
    ctx.moveTo(0, height * 0.88)
    ctx.quadraticCurveTo(width * 0.25, height * 0.82, width * 0.5, height * 0.86)
    ctx.quadraticCurveTo(width * 0.75, height * 0.9, width, height * 0.85)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  },

  drawCloud(ctx, x, y, size) {
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.arc(x - size * 0.4, y + 10, size * 0.35, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y + 5, size * 0.4, 0, Math.PI * 2)
    ctx.arc(x + size * 0.2, y - 10, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  },

  drawHPBar(ctx, x, y, width, height, hp, maxHp, label = '') {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    this.roundRectPath(ctx, x - width / 2, y, width, height, 6)
    ctx.fill()

    const hpRatio = Math.max(0, hp / maxHp)
    const barColor = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c'

    ctx.fillStyle = barColor
    this.roundRectPath(ctx, x - width / 2 + 2, y + 2, (width - 4) * hpRatio, height - 4, 4)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${label} ${Math.ceil(hp)}/${maxHp}`, x, y + height / 2)
    ctx.restore()
  },

  drawAimLine(ctx, points, color = '#2ecc71', dashed = true) {
    if (points.length < 2) return
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    if (dashed) ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const alpha = i / points.length
      ctx.globalAlpha = 1 - alpha * 0.6
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  },

  drawParticle(ctx, x, y, radius, color, alpha) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  },

  roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  },

  drawButton(ctx, x, y, width, height, text, options = {}) {
    const {
      bgColor = '#3498db',
      textColor = '#ffffff',
      fontSize = 18,
      borderRadius = 12,
      pressed = false
    } = options

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = pressed ? 4 : 8
    ctx.shadowOffsetY = pressed ? 2 : 4

    ctx.fillStyle = bgColor
    this.roundRectPath(ctx, x - width / 2, y - height / 2, width, height, borderRadius)
    ctx.fill()

    ctx.shadowColor = 'transparent'

    ctx.fillStyle = textColor
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
    ctx.restore()
  },

  drawText(ctx, text, x, y, options = {}) {
    const {
      color = '#ffffff',
      fontSize = 24,
      bold = false,
      align = 'center',
      alpha = 1,
      shadow = true
    } = options

    ctx.save()
    ctx.globalAlpha = alpha
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
    }
    ctx.fillStyle = color
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px sans-serif`
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}

module.exports = DrawUtils