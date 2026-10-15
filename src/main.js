// 雪人打怪兽 - 游戏主入口
// 负责初始化 Canvas、管理场景切换、处理触摸事件、驱动游戏主循环

const StartScene = require('./scenes/StartScene')
const GameScene = require('./scenes/GameScene')
const OverScene = require('./scenes/OverScene')

// 屏幕尺寸变量（逻辑像素，场景代码均使用逻辑坐标）
let SCREEN_WIDTH = 375
let SCREEN_HEIGHT = 667
// 设备像素比：用于把画布放大到物理像素，保证文字渲染锐利不模糊
let DPR = 1
let canvas = null
let ctx = null

// 获取屏幕尺寸（容错处理）
try {
  const screenInfo = wx.getSystemInfoSync()
  SCREEN_WIDTH = screenInfo.windowWidth || screenInfo.screenWidth || 375
  SCREEN_HEIGHT = screenInfo.windowHeight || screenInfo.screenHeight || 667
  DPR = screenInfo.pixelRatio || 1
} catch (e) {
  console.warn('getSystemInfoSync failed, using default size:', e)
}

// 初始化 Canvas
try {
  canvas = wx.createCanvas()
  // 画布使用物理像素（逻辑尺寸 × DPR），避免高分屏放大模糊
  canvas.width = SCREEN_WIDTH * DPR
  canvas.height = SCREEN_HEIGHT * DPR
  ctx = canvas.getContext('2d')
  // 缩放绘图坐标系：后续所有绘制仍按逻辑像素书写
  ctx.scale(DPR, DPR)
} catch (e) {
  console.error('canvas init failed:', e)
}

// 场景类型枚举
const SCENE = {
  START: 'start',   // 开始界面
  GAME: 'game',     // 游戏界面
  OVER: 'over'      // 结算界面
}

// 当前场景状态
const sceneState = {
  current: null,    // 当前场景实例
  type: SCENE.START,
  score: 0,
  win: false,
  time: 0           // 整局总耗时（秒）
}

// 上一帧时间戳
let lastTime = 0

/**
 * 切换场景
 * @param {string} type - 场景类型
 * @param {object} data - 传递给场景的数据
 */
function switchScene(type, data) {
  sceneState.type = type
  switch (type) {
    case SCENE.START:
      sceneState.current = new StartScene(ctx, SCREEN_WIDTH, SCREEN_HEIGHT)
      break
    case SCENE.GAME:
      sceneState.current = new GameScene(ctx, SCREEN_WIDTH, SCREEN_HEIGHT)
      break
    case SCENE.OVER:
      sceneState.current = new OverScene(ctx, SCREEN_WIDTH, SCREEN_HEIGHT, data || { score: 0, win: false })
      break
  }
}

// 初始进入开始界面
switchScene(SCENE.START)

// 触摸事件处理：分发给当前场景
wx.onTouchStart((e) => {
  if (sceneState.current && sceneState.current.onTouchStart) {
    sceneState.current.onTouchStart(e.touches[0], (type, data) => {
      // 场景间跳转回调
      if (type === 'game:start') {
        switchScene(SCENE.GAME)
      } else if (type === 'game:over' || type === 'game:win') {
        sceneState.score = (data && data.score) || 0
        sceneState.win = type === 'game:win' || (data && data.win === true)
        sceneState.time = (data && data.time) || 0
        switchScene(SCENE.OVER, { score: sceneState.score, win: sceneState.win, time: sceneState.time })
      } else if (type === 'scene:start') {
        switchScene(SCENE.START)
      } else if (type === 'scene:restart') {
        switchScene(SCENE.GAME)
      }
    })
  }
})

wx.onTouchMove((e) => {
  if (sceneState.current && sceneState.current.onTouchMove) {
    sceneState.current.onTouchMove(e.touches[0])
  }
})

wx.onTouchEnd((e) => {
  if (sceneState.current && sceneState.current.onTouchEnd) {
    sceneState.current.onTouchEnd(e.changedTouches[0])
  }
})

/**
 * 游戏主循环
 * @param {number} timestamp - 当前时间戳
 * 使用 requestAnimationFrame 驱动，限制 dt 最大 0.05s 防止卡顿时物理暴走
 */
function loop(timestamp) {
  const now = timestamp || Date.now()
  const dt = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now

  // 清空画布
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

  // 更新和渲染当前场景
  if (sceneState.current) {
    sceneState.current.update(dt)
    sceneState.current.render()
  }

  requestAnimationFrame(loop)
}

// 启动主循环
requestAnimationFrame(loop)
