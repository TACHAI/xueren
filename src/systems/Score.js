class Score {
  constructor() {
    this.total = 0
    this.hits = 0
    this.headshots = 0
    this.dodgeSuccesses = 0
    this.comboBonuses = 0
  }

  add(points) {
    this.total += points
  }

  addCombo(comboCount) {
    this.hits++
    if (comboCount >= 3) {
      this.comboBonuses += comboCount * 5
      this.total += comboCount * 5
    }
  }

  addHeadshot() {
    this.headshots++
    this.total += 20
  }

  addDodgeBonus(success) {
    if (success) {
      this.dodgeSuccesses++
      this.total += 15
    }
  }

  addWinBonus(won) {
    if (won) {
      this.total += 100
    }
  }
}

module.exports = Score