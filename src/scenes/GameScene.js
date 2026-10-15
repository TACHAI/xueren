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
    this.totalTime = 0 // 整局游戏总耗时（秒）

    this.gameState = 'playing'
    this.stateTimer = 0
    this.levelComplete = false

    // 插屏广告：通关过渡时才创建并展示（懒加载）
    this.interstitialAd = null
    this._interstitialShownLevel = -1 // 本局已展示过插屏的关卡索引，-1 表示未展示
    this.rewardedVideoAd = null
    this.reviveUsed = false      // 每局限复活一次
    this.reviveBtnBounds = null  // 复活按钮触摸区域
    this._adShowing = false
    this._adLoaded = false

    // 激励视频：进入游戏即创建并预加载，保证通关/死亡时"秒出"
    // 用异步延迟创建避开进入游戏瞬间的渲染层冲突（黑屏）
    this._initRewardedVideoAd()

    // 关卡限时：每关 2 分钟（120 秒）
    this.levelTimeLimit = 120
    this.levelTimeRemaining = this.levelTimeLimit
    this.timeUp = false // 是否因超时结束（用于结算界面提示）
  }

  update(dt) {
    this.time += dt
    // 累计整局耗时：游戏进行中与关卡间歇均计入
    if (this.gameState === 'playing' || this.gameState === 'levelComplete') {
      this.totalTime += dt
    }
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
          this.callback && this.callback('game:win', { score: this.score, time: this.totalTime })
        }
      }
      this.updateParticles(dt)
      return
    }

    if (this.gameState === 'gameOver') {
      this.stateTimer += dt
      // 广告观看中：暂停结算倒计时，等待 onClose 回调
      if (this._adShowing) {
        this.stateTimer = 0 // 观看期间不计入复活界面停留时长
        this.updateParticles(dt)
        return
      }
      // 已复活过、广告不可用：直接走自动结算
      const canRevive = !this.reviveUsed && !this._rewardedFailed && typeof wx !== 'undefined' && !!wx.createRewardedVideoAd
      if (!canRevive) {
        if (this.stateTimer > 2.5) {
          this.callback && this.callback('game:over', { score: this.score, time: this.totalTime })
        }
      } else if (this.stateTimer > 30) {
        // 复活界面最多停留 30 秒，超时自动结算
        this.callback && this.callback('game:over', { score: this.score, time: this.totalTime })
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

    const levelWidth = this.levelManager.width
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

    const levelWidth = this.levelManager.width
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

      // 前 3 关通关：过渡画面刚出现即展示插屏广告（利用 2.8 秒过渡作为加载/展示窗口）
      // currentLevel 为刚完成的关卡索引（0/1/2 = 第 1/2/3 关）；每关仅展示一次
      if (
        this.levelManager.currentLevel < 3 &&
        !this.levelManager.isLastLevel() &&
        this._interstitialShownLevel !== this.levelManager.currentLevel
      ) {
        this._interstitialShownLevel = this.levelManager.currentLevel
        const ad = this.ensureInterstitialAd()
        if (ad) {
          ad.show().catch((err) => {
            console.error('插屏广告显示失败', err)
          })
        }
      }
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
    const levelWidth = this.levelManager.width
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
    DrawUtils.setFont(ctx, 18, true)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const levelNum = this.levelManager.currentLevel + 1
    ctx.fillText(`第${levelNum}关`, 20, 25)

    ctx.fillStyle = '#f1c40f'
    ctx.textAlign = 'center'
    DrawUtils.setFont(ctx, 20, true)
    ctx.fillText(`分数: ${this.score}`, this.width / 2, 25)

    ctx.textAlign = 'right'
    this.drawHPIcons(ctx, this.width - 20, 25, this.player.hp)

    // 关卡倒计时（屏幕顶部中间）
    this.drawLevelTimer(ctx)

    ctx.fillStyle = '#ffffff'
    DrawUtils.setFont(ctx, 14)
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
      DrawUtils.setFont(ctx, 16)
      ctx.fillStyle = it.color
      ctx.fillText(it.icon, cx, cy)
      cx -= 20
      ctx.fillStyle = '#ffffff'
      DrawUtils.setFont(ctx, 12)
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
      DrawUtils.setFont(ctx, 34, true)
      ctx.fillText(timeStr, this.width / 2, 55)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#ffffff'
      DrawUtils.setFont(ctx, 22, true)
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
      DrawUtils.setFont(ctx, 28, true)
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

    // 可复活：显示观看广告复活按钮；否则显示自动返回提示
    if (!this.reviveUsed && !this._rewardedFailed && typeof wx !== 'undefined' && !!wx.createRewardedVideoAd) {
      const btnW = 220
      const btnH = 50
      const btnX = (this.width - btnW) / 2
      const btnY = this.height / 2 + 70
      this.reviveBtnBounds = { x: btnX, y: btnY, width: btnW, height: btnH }
      DrawUtils.drawButton(ctx, this.width / 2, btnY + btnH / 2, btnW, btnH, '观看广告复活', {
        bgColor: '#2ecc71',
        fontSize: 20
      })
    } else {
      this.reviveBtnBounds = null
      DrawUtils.drawText(ctx, '返回中...', this.width / 2, this.height / 2 + 75, {
        color: '#ffffff',
        fontSize: 16
      })
    }
  }

  /**
   * 懒加载创建插屏广告实例，创建后立即预加载素材，保证过渡画面出现即可秒出
   */
  ensureInterstitialAd() {
    if (this.interstitialAd || this._interstitialFailed) return this.interstitialAd
    try {
      if (typeof wx !== 'undefined' && wx.createInterstitialAd) {
        this.interstitialAd = wx.createInterstitialAd({
          adUnitId: 'adunit-b17748fe89535e8b'
        })
        // 预加载素材，缩短展示等待
        this.interstitialAd.load && this.interstitialAd.load().catch(() => {})
      } else {
        this._interstitialFailed = true
      }
    } catch (e) {
      console.error('插屏广告初始化失败', e)
      this._interstitialFailed = true
      this.interstitialAd = null
    }
    return this.interstitialAd
  }

  /**
   * 进入游戏时异步创建激励视频并预加载，保证需要展示时"秒出"。
   * 延迟一帧创建，避开进入游戏瞬间的渲染层冲突（黑屏）。
   */
  _initRewardedVideoAd() {
    const create = () => {
      if (this.rewardedVideoAd || this._rewardedFailed) return
      try {
        if (typeof wx === 'undefined' || !wx.createRewardedVideoAd) {
          this._rewardedFailed = true
          return
        }
        const ad = wx.createRewardedVideoAd({
          adUnitId: 'adunit-16adc4568c95088b'
        })
        this.rewardedVideoAd = ad
        // 素材拉取成功：标记可用，实现秒出
        ad.onLoad && ad.onLoad(() => { this._adLoaded = true })
        ad.onError && ad.onError((err) => {
          console.error('激励视频加载失败', err)
          this._adLoaded = false
        })
        // 广告关闭回调：完整观看则复活，中途关闭不复活
        ad.onClose((res) => {
          this._adShowing = false
          if (res && res.isEnded) {
            this.revive()
          } else {
            // 未看完：下次展示前重新拉取素材
            ad.load && ad.load().catch(() => {})
          }
        })
        // 预加载素材
        ad.load && ad.load().then(() => { this._adLoaded = true }).catch(() => { this._adLoaded = false })
      } catch (e) {
        console.error('激励视频广告初始化失败', e)
        this._rewardedFailed = true
        this.rewardedVideoAd = null
      }
    }
    // 延迟一帧，避免与首帧渲染冲突
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(create))
    } else {
      create()
    }
  }

  /**
   * 懒加载兜底：进入时尚未创建成功时，首次需要展示再创建
   */
  ensureRewardedVideoAd() {
    if (this.rewardedVideoAd || this._rewardedFailed) return this.rewardedVideoAd
    try {
      if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
        const ad = wx.createRewardedVideoAd({
          adUnitId: 'adunit-16adc4568c95088b'
        })
        this.rewardedVideoAd = ad
        ad.onClose((res) => {
          this._adShowing = false
          if (res && res.isEnded) {
            this.revive()
          } else {
            // 未看完：重置广告状态，下次展示前重新拉取素材
            ad.load && ad.load().catch(() => {})
          }
        })
      } else {
        this._rewardedFailed = true
      }
    } catch (e) {
      console.error('激励视频广告初始化失败', e)
      this._rewardedFailed = true
      this.rewardedVideoAd = null
    }
    return this.rewardedVideoAd
  }

  /**
   * 触发激励视频广告，完整观看后复活（每局限一次）。
   * 注意：点击时仅标记 _adShowing 暂停结算，看完广告才真正置 reviveUsed 并复活，
   * 避免"看完广告却从第一关重新开始"。
   */
  showReviveAd() {
    const ad = this.ensureRewardedVideoAd()
    if (this.reviveUsed || !ad || this._adShowing) return
    this._adShowing = true
    // 已预加载：直接秒出；否则走 load->show 重试链
    ad.show().catch(() => {
      ad.load()
        .then(() => ad.show())
        .catch((err) => {
          console.error('激励视频广告显示失败', err)
          // 展示失败：恢复为可复活等待状态，由超时兜底结算
          this._adShowing = false
        })
    })
  }

  /**
   * 完整观看广告后的复活逻辑
   */
  revive() {
    this._adShowing = false
    this.reviveUsed = true     // 看完广告才真正消耗复活机会
    this.reviveBtnBounds = null
    this.player.hp = this.player.maxHp
    this.player.invincible = 3 // 复活后 3 秒无敌
    this.player.vx = 0
    this.player.vy = 0
    // 坠落死亡：把玩家放回关卡出生点，避免复活后立即再次坠落
    if (this.player.y > this.height) {
      const ps = this.levelManager.playerStart || { x: 60, y: 540 }
      this.player.x = ps.x
      this.player.y = ps.y
    }
    this.timeUp = false
    this.gameState = 'playing'
  }

  onTouchStart(touch, callback) {
    this.callback = callback
    // gameOver 状态下优先检测复活按钮点击
    if (this.gameState === 'gameOver' && this.reviveBtnBounds) {
      const b = this.reviveBtnBounds
      const tx = touch.clientX !== undefined ? touch.clientX : touch.x
      const ty = touch.clientY !== undefined ? touch.clientY : touch.y
      if (tx >= b.x && tx <= b.x + b.width && ty >= b.y && ty <= b.y + b.height) {
        this.showReviveAd()
        return
      }
    }
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
