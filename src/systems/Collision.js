// 雪人打怪兽 - 碰撞检测系统
// 提供 AABB、圆形、点-矩形等碰撞检测方法

const MathUtils = require('../utils/Math')

const Collision = {
  /**
   * AABB 矩形碰撞检测
   * @param {{x:number, y:number, width:number, height:number}} rect1
   * @param {{x:number, y:number, width:number, height:number}} rect2
   * @returns {boolean}
   */
  aabb(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  },

  /**
   * 圆形碰撞检测
   * @param {{x:number, y:number, radius:number}} circle1
   * @param {{x:number, y:number, radius:number}} circle2
   * @returns {boolean}
   */
  circle(circle1, circle2) {
    const dx = circle1.x - circle2.x
    const dy = circle1.y - circle2.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < circle1.radius + circle2.radius
  },

  /**
   * 点是否在矩形内
   * @param {number} x
   * @param {number} y
   * @param {{x:number, y:number, width:number, height:number}} rect
   * @returns {boolean}
   */
  pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height
  },

  /**
   * 雪球击中敌人（圆形碰撞，排除死亡敌人）
   * @param {Snowball} snowball
   * @param {Enemy} enemy
   * @returns {boolean}
   */
  snowballHitEnemy(snowball, enemy) {
    if (enemy.isDead && enemy.state === 'dead') return false
    const sbCircle = snowball.getHitCircle()
    const enCircle = enemy.getHitCircle()
    return this.circle(sbCircle, enCircle)
  },

  /**
   * 玩家撞到敌人（AABB碰撞，排除死亡敌人）
   * @param {Player} player
   * @param {Enemy} enemy
   * @returns {boolean}
   */
  playerHitEnemy(player, enemy) {
    if (enemy.state === 'dead') return false
    const pRect = player.getRect()
    const eRect = enemy.getRect()
    return this.aabb(pRect, eRect)
  },

  /**
   * 推动的雪球撞到敌人（圆形碰撞，排除死亡敌人）
   * @param {Enemy} pushedBall - 推动中的敌人（大雪球）
   * @param {Enemy} enemy - 目标敌人
   * @returns {boolean}
   */
  pushedBallHitEnemy(pushedBall, enemy) {
    if (enemy.state === 'dead') return false
    const pbCircle = pushedBall.getHitCircle()
    const eCircle = enemy.getHitCircle()
    return this.circle(pbCircle, eCircle)
  }
}

module.exports = Collision
