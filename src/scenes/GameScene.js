const DrawUtils = require('../utils/Draw')
const Player = require('../entities/Player')
const Enemy = require('../entities/Enemy')
const Snowball = require('../entities/Snowball')
const PowerUp = require('../entities/PowerUp')
const Collision = require('../systems/Collision')
const LevelManager = require('../systems/Level')
const InputSystem = require('../systems/Input')
const MathUtils = require('../utils/Math')

class GameScene {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.time = 0
    this.cameraX = 0
    this.cameraY = 0
    this.targetCameraX = 0
    this.targetCameraY = 0

    this.input = new InputSystem()
    this.input.setupButtons(width, height)

    this.levelManager = new LevelManager()
    this.levelManager.loadLevel(0)

    const ps = this.levelManager.playerStart || { x: 50, y: 540 }
    this.player = new Player(ps.x, ps.y)
    this.snowballs = []
    this.particles = []
    this.powerUps = []
    this.pendingPowerUp = null
    this.score = 0
    this.enemiesKilled = 0
    this.comboCount = 0
    this.comboTimer = 0
    this.callback = null

    this.gameState = 'playing'
    this.stateTimer = 0
    this.levelComplete = false

    // 关卡限时：每关 2 分钟（120 秒）
    this.levelTimeLimit = 120
    this.levelTimeRemaining = this.levelTimeLimit
    this.timeUp = false // 是否因超时结束（用于结算界面提示）
  }

  update(dt) {
    this.time += dt
    this.comboTimer -= dt
    if (this.comboTimer <= 0) this.comboCount = 0

    if (this.gameState === 'levelComplete') {
      this.stateTimer += dt
      const input = this.input.getInput()
      this.player.update(dt, input, this.levelManager.platforms)
      this.updatePowerUps(dt)
      this.checkPowerUpPickup()

      if (this.stateTimer > 2.8) {
        if (this.pendingPowerUp && !this.pendingPowerUp.collected) {
          this.player.applyPowerUp(this.pendingPowerUp.type)
          this.pendingPowerUp.collect()
        }
        this.stateTimer = 0
        const hasNext = this.levelManager.nextLevel()
        if (hasNext) {
          const nps = this.levelManager.playerStart || { x: 60, y: 540 }
          this.player.x = nps.x
          this.player.y = nps.y
          this.player.hp = this.player.maxHp
          this.player.vx = 0
          this.player.vy = 0
          this.player.facing = 1
          this.levelComplete = false
          this.powerUps = []
          this.pendingPowerUp = null
          this.gameState = 'playing'
          this.levelTimeRemaining = this.levelTimeLimit // 重置下一关倒计时
          this.timeUp = false
        } else {
          this.callback && this.callback('game:win', { score: this.score })
        }
      }
      this.updateParticles(dt)
      return
    }

    if (this.gameState === 'gameOver') {
      this.stateTimer += dt
      if (this.stateTimer > 2.5) {
        this.callback && this.callback('game:over', { score: this.score })
      }
      this.updateParticles(dt)
      return
    }

    if (this.gameState !== 'playing') return

    // 关卡倒计时：仅在 playing 状态扣减
    this.levelTimeRemaining -= dt
    if (this.levelTimeRemaining <= 0) {
      this.levelTimeRemaining = 0
      this.timeUp = true
      this.gameState = 'gameOver'
      this.stateTimer = 0
      return
    }

    this.updatePlayer(dt)
    this.updateLevel(dt)
    this.updateSnowballs(dt)
    this.updateEnemies(dt)
    this.updatePowerUps(dt)
    this.updateParticles(dt)
    this.checkCollisions()
    this.checkPowerUpPickup()
    this.updateCamera()
    this.checkLevelComplete()
  }

  updatePlayer(dt) {
    const input = this.input.getInput()
    this.player.update(dt, input, this.levelManager.platforms)

    const levelWidth = 900
    const minX = this.player.width / 2
    const maxX = levelWidth - this.player.width / 2
    if (this.player.x < minX) this.player.x = minX
    if (this.player.x > maxX) this.player.x = maxX

    if (this.player.y > this.cameraY + this.height + 100) {
      this.player.hp = 0
      this.gameState = 'gameOver'
      this.stateTimer = 0
      return
    }

    if (input.shoot && this.player.canShoot()) {
      const shootData = this.player.shoot()
      if (shootData) {
        this.snowballs.push(new Snowball(
          shootData.x, shootData.y, shootData.vx, shootData.vy, shootData.radius
        ))
      }
    }
  }

  updateLevel(dt) {
    this.levelManager.update(dt)
  }

  updateSnowballs(dt) {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const sb = this.snowballs[i]
      sb.update(dt)
      if (sb.dead || sb.x < -50 || sb.x > 950) {
        this.snowballs.splice(i, 1)
      }
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.levelManager.enemies) {
      enemy.update(dt, this.levelManager.platforms, this.player)
    }

    for (let i = this.levelManager.enemies.length - 1; i >= 0; i--) {
      const e = this.levelManager.enemies[i]
      if (e.deathAnim <= 0 && e.state === 'dead') {
        this.levelManager.enemies.splice(i, 1)
      }
    }
  }

  updatePowerUps(dt) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i]
      p.update(dt, this.levelManager.platforms)
      if (p.isExpired()) {
        this.powerUps.splice(i, 1)
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 200 * dt
      p.life -= dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  checkCollisions() {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const sb = this.snowballs[i]
      for (const enemy of this.levelManager.enemies) {
        if (enemy.state === 'dead' || enemy.state === 'pushed') continue
        if (Collision.snowballHitEnemy(sb, enemy)) {
          const wasCovered = enemy.addSnowLayer()
          this.snowballs.splice(i, 1)
          this.spawnHitParticles(sb.x, sb.y)
          if (wasCovered) {
            this.score += 50
            this.comboCount++
            this.comboTimer = 2
            this.spawnCoverParticles(enemy.x, enemy.y)
          }
          break
        }
      }
    }

    for (const enemy of this.levelManager.enemies) {
      if (enemy.state !== 'pushed') continue
      for (const other of this.levelManager.enemies) {
        if (other === enemy || other.state === 'dead' || other.state === 'pushed') continue
        if (Collision.pushedBallHitEnemy(enemy, other)) {
          other.die()
          this.score += 100
          this.enemiesKilled++
          this.spawnHitParticles(other.x, other.y, 20)
        }
      }
      if (enemy.state === 'pushed' && enemy.y > this.cameraY + this.height + 200) {
        enemy.state = 'dead'
        enemy.deathAnim = 0.3
      }
    }

    for (const enemy of this.levelManager.enemies) {
      if (enemy.state === 'dead') continue
      if (Collision.playerHitEnemy(this.player, enemy)) {
        if (enemy.state === 'pushed') {
          const pushDir = enemy.x > this.player.x ? 1 : -1
          enemy.direction = pushDir
          enemy.vx = pushDir * enemy.pushSpeed
          this.player.vx = -pushDir * 150
          this.spawnHitParticles(this.player.x, this.player.y, 6)
        } else if (enemy.state === 'covered') {
          const pushDir = enemy.x > this.player.x ? 1 : -1
          enemy.direction = pushDir
          enemy.state = 'pushed'
          enemy.vx = pushDir * enemy.pushSpeed
          this.spawnHitParticles(enemy.x, enemy.y, 8)
        } else if (this.player.takeDamage()) {
          this.spawnHitParticles(this.player.x, this.player.y, 15)
          this.comboCount = 0
          if (this.player.hp <= 0) {
            this.gameState = 'gameOver'
            this.stateTimer = 0
          }
        }
      }
    }
  }

  checkPowerUpPickup() {
    const pCircle = this.player.getHitCircle()
    for (const p of this.powerUps) {
      if (p.collected) continue
      if (Collision.circle(pCircle, p.getHitCircle())) {
        p.collect()
        this.player.applyPowerUp(p.type)
        this.spawnHitParticles(p.x, p.y, 18)
        if (this.pendingPowerUp === p) {
          this.pendingPowerUp = null
        }
      }
    }
  }

  spawnHitParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(50, 150)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        radius: MathUtils.randomRange(2, 5),
        color: '#ffffff',
        life: MathUtils.randomRange(0.3, 0.6),
        maxLife: 0.6,
        alpha: 1
      })
    }
  }

  spawnCoverParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(80, 200)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        radius: MathUtils.randomRange(3, 6),
        color: '#ffffff',
        life: MathUtils.randomRange(0.5, 0.8),
        maxLife: 0.8,
        alpha: 1
      })
    }
  }

  updateCamera() {
    const targetY = Math.max(0, this.player.y - this.height * 0.8)
    this.targetCameraY = targetY
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.12

    const levelWidth = 900
    const maxCameraX = Math.max(0, levelWidth - this.width)
    const targetX = Math.max(0, Math.min(this.player.x - this.width * 0.4, maxCameraX))
    this.targetCameraX = targetX
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.1
  }

  checkLevelComplete() {
    if (!this.levelComplete && this.levelManager.isLevelComplete()) {
      this.levelComplete = true
      this.gameState = 'levelComplete'
      this.stateTimer = 0
      this.score += 200
      this.spawnLevelClearPowerUp()
    }
  }

  spawnLevelClearPowerUp() {
    const completedLevelIndex = this.levelManager.currentLevel
    const isLast = this.levelManager.isLastLevel()
    if (isLast) return

    const pool = LevelManager.getAvailablePowerUps(completedLevelIndex)
    if (pool.length === 0) return

    const type = pool[MathUtils.randomInt(0, pool.length - 1)]
    const px = MathUtils.clamp(this.player.x, 120, this.width - 120)
    const py = this.player.y - 140
    const powerUp = new PowerUp(px, py, type)
    this.powerUps.push(powerUp)
    this.pendingPowerUp = powerUp
  }

  render() {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(-this.cameraX, -this.cameraY)

    this.drawWorld(ctx)
    this.drawPlatforms(ctx)
    this.drawEnemies(ctx)
    this.drawSnowballs(ctx)
    this.drawPowerUps(ctx)
    this.drawPlayer(ctx)
    this.drawParticles(ctx)

    ctx.restore()

    this.drawHUD(ctx)
    this.input.render(ctx)

    if (this.gameState === 'levelComplete') {
      this.drawLevelComplete(ctx)
    } else if (this.gameState === 'gameOver') {
      this.drawGameOver(ctx)
    }
  }

  drawWorld(ctx) {
    const levelWidth = 900
    DrawUtils.drawBackground(ctx, levelWidth, this.height + 300)

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 0; i < 30; i++) {
      const x = (i * 113 + this.time * 10) % levelWidth
      const y = ((i * 51) % 300) + 50
      ctx.beginPath()
      ctx.arc(x, y, MathUtils.randomRange(1, 2), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawPlatforms(ctx) {
    for (const platform of this.levelManager.platforms) {
      platform.render(ctx)
    }
  }

  drawEnemies(ctx) {
    for (const enemy of this.levelManager.enemies) {
      enemy.render(ctx)
    }
  }

  drawSnowballs(ctx) {
    for (const sb of this.snowballs) {
      sb.render(ctx)
    }
  }

  drawPowerUps(ctx) {
    for (const p of this.powerUps) {
      p.render(ctx)
    }
  }

  drawPlayer(ctx) {
    this.player.render(ctx)
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      DrawUtils.drawParticle(ctx, p.x, p.y, p.radius, p.color, p.alpha)
    }
  }

  drawHUD(ctx) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, this.width, 80)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const levelNum = this.levelManager.currentLevel + 1
    ctx.fillText(`第${levelNum}关`, 20, 25)

    ctx.fillStyle = '#f1c40f'
    ctx.textAlign = 'center'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`分数: ${this.score}`, this.width / 2, 25)

    ctx.textAlign = 'right'
    this.drawHPIcons(ctx, this.width - 20, 25, this.player.hp)

    // 关卡倒计时（屏幕顶部中间）
    this.drawLevelTimer(ctx)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    const remaining = this.levelManager.enemies.filter(e => e.state !== 'dead').length
    const covered = this.levelManager.enemies.filter(e => e.state === 'covered' || e.state === 'pushed').length
    ctx.fillText(`剩余 ${remaining}`, 20, 58)

    if (covered > 0) {
      ctx.fillStyle = '#87CEEB'
      ctx.fillText(`可推 ${covered}`, 100, 58)
    }

    this.drawPowerUpStatus(ctx)

    if (this.comboCount >= 2) {
      DrawUtils.drawText(ctx, `${this.comboCount} 连击!`, this.width / 2, 95, {
        color: '#e74c3c',
        fontSize: 24 + this.comboCount * 2,
        bold: true,
        alpha: Math.min(1, this.comboTimer)
      })
    }

    ctx.restore()
  }

  drawPowerUpStatus(ctx) {
    const p = this.player
    const items = []
    if (p.powerUps.bigSnow > 0) items.push({ icon: '❄', color: '#3498db', count: p.powerUps.bigSnow })
    if (p.powerUps.fastShoot > 0) items.push({ icon: '⚡', color: '#e74c3c', count: p.powerUps.fastShoot })
    if (p.powerUps.fastMove > 0) items.push({ icon: '✦', color: '#2ecc71', count: p.powerUps.fastMove })

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    let cx = this.width - 20
    const cy = 58
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]
      ctx.font = '16px sans-serif'
      ctx.fillStyle = it.color
      ctx.fillText(it.icon, cx, cy)
      cx -= 20
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.fillText(`x${it.count}`, cx, cy)
      cx -= 26
    }
  }

  drawHPIcons(ctx, x, y, hp) {
    const heartSize = 16
    const spacing = 5
    for (let i = 0; i < this.player.maxHp; i++) {
      const hx = x - i * (heartSize + spacing)
      ctx.fillStyle = i < hp ? '#e74c3c' : 'rgba(255,255,255,0.3)'
      this.drawHeart(ctx, hx, y, heartSize / 2)
    }
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3)
    ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size * 1.2)
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.3)
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3)
    ctx.fill()
  }

  /**
   * 绘制关卡倒计时
   * - 正常：白色 22px，居中显示在顶部
   * - 最后 10 秒：字体变大（34px）、变红、闪烁
   */
  drawLevelTimer(ctx) {
    const minutes = Math.floor(this.levelTimeRemaining / 60)
    const seconds = Math.floor(this.levelTimeRemaining % 60)
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    const isLast10 = this.levelTimeRemaining <= 10
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isLast10) {
      // 最后 10 秒：字体变大、红色、闪烁（每秒闪 2 次）
      const flashOn = Math.floor(this.time * 4) % 2 === 0
      ctx.globalAlpha = flashOn ? 1 : 0.3
      ctx.fillStyle = '#e74c3c'
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText(timeStr, this.width / 2, 55)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(timeStr, this.width / 2, 55)
    }
  }

  drawLevelComplete(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, this.width, this.height)

    DrawUtils.drawText(ctx, '关卡完成!', this.width / 2, this.height * 0.35, {
      color: '#f1c40f',
      fontSize: 44,
      bold: true
    })

    DrawUtils.drawText(ctx, `分数: ${this.score}`, this.width / 2, this.height * 0.35 + 50, {
      color: '#ffffff',
      fontSize: 22,
      bold: true
    })

    if (this.pendingPowerUp && !this.pendingPowerUp.collected) {
      const info = PowerUp.INFO[this.pendingPowerUp.type]
      DrawUtils.drawText(ctx, '获得道具!', this.width / 2, this.height * 0.55, {
        color: info.color,
        fontSize: 24,
        bold: true
      })

      ctx.save()
      ctx.translate(this.width / 2, this.height * 0.55 + 60)
      const pulse = 1 + Math.sin(this.time * 5) * 0.08
      ctx.shadowColor = info.glow
      ctx.shadowBlur = 20
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 * pulse)
      gradient.addColorStop(0, info.glow)
      gradient.addColorStop(0.7, info.color)
      gradient.addColorStop(1, '#ffffff')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(info.icon, 0, 1)
      ctx.restore()

      DrawUtils.drawText(ctx, info.name, this.width / 2, this.height * 0.55 + 115, {
        color: '#ffffff',
        fontSize: 18
      })

      DrawUtils.drawText(ctx, '走过去拾取 (或自动获得)', this.width / 2, this.height * 0.55 + 145, {
        color: '#bdc3c7',
        fontSize: 14
      })
    } else {
      const isLastLevel = this.levelManager.isLastLevel()
      if (isLastLevel) {
        DrawUtils.drawText(ctx, '即将结算', this.width / 2, this.height * 0.55, {
          color: '#ffffff',
          fontSize: 20
        })
      } else {
        DrawUtils.drawText(ctx, '准备下一关...', this.width / 2, this.height * 0.55, {
          color: '#ffffff',
          fontSize: 20
        })
      }
    }
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 0, this.width, this.height)

    DrawUtils.drawText(ctx, '游戏结束', this.width / 2, this.height / 2 - 50, {
      color: '#e74c3c',
      fontSize: 48,
      bold: true
    })

    // 超时结束时显示“时间到!”提示
    if (this.timeUp) {
      DrawUtils.drawText(ctx, '时间到!', this.width / 2, this.height / 2 - 5, {
        color: '#f1c40f',
        fontSize: 24,
        bold: true
      })
    }

    DrawUtils.drawText(ctx, `最终分数: ${this.score}`, this.width / 2, this.height / 2 + 35, {
      color: '#ffffff',
      fontSize: 24
    })

    DrawUtils.drawText(ctx, '返回中...', this.width / 2, this.height / 2 + 75, {
      color: '#ffffff',
      fontSize: 16
    })
  }

  onTouchStart(touch, callback) {
    this.callback = callback
    this.input.onTouchStart(touch)
  }

  onTouchMove(touch) {
    this.input.onTouchMove(touch)
  }

  onTouchEnd(touch) {
    this.input.onTouchEnd(touch)
  }
}

module.exports = GameScene
