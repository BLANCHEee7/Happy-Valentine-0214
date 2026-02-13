// 6x6 连连看逻辑

const ROWS = 6;
const COLS = 6;
// 使用 1~9 这 9 种图片
const ICON_TYPES = 9;

let board = []; // 保存每个格子里是哪种图片
let firstSelection = null; // { row, col }

const boardElement = document.getElementById("board");
const textDisplay = document.getElementById("text-display");
const statusElement = document.getElementById("status");
const lineCanvas = document.getElementById("line-canvas");
const lineCtx = lineCanvas.getContext("2d");
const textPopup = document.getElementById("text-popup");

// 直接内置 1.txt ~ 9.txt 的内容，避免浏览器本地 file:// 访问限制
const TEXT_MAP = {
  1: "第一张合照，梦开始的地方嘻嘻^^",
  2: "第一次一起过万圣节，很帅气的一天喏！兔宝宝漂亮的一天，小公主兔宝宝！",
  3: "在一起之后度过的第一个寒假，很漫长捏。让你难过了很多次TT 总算见面一起旅游啦！",
  4: "第一个情人节！很幸福耶~一起做了戒指💍蛋糕🎂还有很多礼物！太开心啦~（其实我们之前也一起过过hhh大二的时候一起去看了想见你电影",
  5: "100天噜！悄咪咪逃课去了hh因为没拍到好看的照片中途崩溃的小兔子宝宝和贱贱小猪皮",
  6: "一起去了音乐节！神奇的体验，提前准备了好多吃的野餐，把我们女王大人累坏了，因为要拍照一直挨饿的宝宝辛苦哩！小猪会一直进步的，会成为出片大师的！",
  7: "去小韩和小日子！在南山塔挂上了我们专属爱心小粉锁🔒小兔兔和小猪猪会一直在一起哟！",
  8: "小兔宝宝生日+七夕！忙碌的一天，因为我没做好攻略和计划白跑了一趟梅钢博物馆TT幸好之后很顺利！",
  9: "长长的圣诞月，圣诞的独特回忆耶！去年圣诞还在吵架绝交，现在是这样啦！多亏了小兔子女王！永远爱你！！",
};

function init() {
  generateBoard();
  renderBoard();
  statusElement.textContent = "已生成新棋盘。";
}

// 生成棋盘：
// - 6×6=36 个格子
// - 一共 18 对图片（36 个），从 1~9 轮流填充，保证都是成对出现
function generateBoard() {
  const tiles = [];
  const totalPairs = (ROWS * COLS) / 2; // 18
  for (let i = 0; i < totalPairs; i++) {
    const type = (i % ICON_TYPES) + 1; // 1~9 轮流
    tiles.push(type, type);
  }

  // 打乱
  shuffle(tiles);

  // 填入 8x8
  board = [];
  let index = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(tiles[index++]);
    }
    board.push(row);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderBoard() {
  boardElement.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const value = board[r][c];
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = r;
      tile.dataset.col = c;

      if (value > 0) {
        tile.style.backgroundImage = `url('${value}.jpg')`;
      } else {
        tile.style.backgroundImage = "none";
        tile.style.backgroundColor = "transparent";
        tile.style.borderStyle = "dashed";
        tile.style.borderColor = "rgba(197, 211, 255, 0.5)";
        tile.style.cursor = "default";
      }

      tile.addEventListener("click", onTileClick);
      boardElement.appendChild(tile);
    }
  }
  resizeLineCanvas();
}

function onTileClick(e) {
  const tile = e.currentTarget;
  const row = parseInt(tile.dataset.row, 10);
  const col = parseInt(tile.dataset.col, 10);
  const value = board[row][col];

  // 再次点击同一个，取消选中
  if (firstSelection && firstSelection.row === row && firstSelection.col === col) {
    clearSelection();
    return;
  }

  if (!firstSelection) {
    firstSelection = { row, col };
    tile.classList.add("selected");
    statusElement.textContent = "请选择另一张相同的图片。";
  } else {
    const r1 = firstSelection.row;
    const c1 = firstSelection.col;
    const v1 = board[r1][c1];
    const v2 = value;

    const prevTile = getTileElement(r1, c1);

    if (v1 !== v2) {
      // 不同图
      statusElement.textContent = "两张图片不相同，无法消除。";
      clearSelection();
      return;
    }

    // 相同图片，检查是否可以连线，并获取连线路径
    const path = findConnectionPath(r1, c1, row, col);
    if (path) {
      drawConnectionPath(path);
      // 可以消除
      board[r1][c1] = 0;
      board[row][col] = 0;

      if (prevTile) prevTile.classList.add("removed");
      tile.classList.add("removed");

      // 为了视觉效果，稍微延迟再更新背景
      setTimeout(() => {
        if (prevTile) {
          prevTile.style.backgroundImage = "none";
          prevTile.style.backgroundColor = "transparent";
          prevTile.style.borderStyle = "dashed";
          prevTile.style.borderColor = "rgba(197, 211, 255, 0.5)";
          prevTile.style.cursor = "default";
        }
        tile.style.backgroundImage = "none";
        tile.style.backgroundColor = "transparent";
        tile.style.borderStyle = "dashed";
        tile.style.borderColor = "rgba(197, 211, 255, 0.5)";
        tile.style.cursor = "default";
        clearConnectionPath();
      }, 150);

      statusElement.textContent = `成功消除一对图片（编号 ${v1}），正在加载对应文本…`;
      loadTextForValue(v1);

      clearSelection(true);
      checkWin();
    } else {
      statusElement.textContent = "两张图片无法在不超过两次拐弯的前提下连线，无法消除。";
      clearSelection();
    }
  }
}

function getTileElement(r, c) {
  return boardElement.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
}

function clearSelection(keepRemoved = false) {
  const selected = boardElement.querySelector(".tile.selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  if (!keepRemoved) {
    const removed = boardElement.querySelectorAll(".tile.removed");
    removed.forEach((el) => el.classList.remove("removed"));
  }
  firstSelection = null;
}

// 加载对应编号的文本：使用内置 TEXT_MAP，在中间弹出文本框
function loadTextForValue(value) {
  const text = TEXT_MAP[value] || `没有为编号 ${value} 配置文本内容`;
  textDisplay.textContent = text;
  if (textPopup) {
    textPopup.classList.add("visible");
  }
  statusElement.textContent = `已显示编号 ${value} 的文本（点击文本框外部可关闭）。`;
}

// 调整连线路径画布尺寸
function resizeLineCanvas() {
  if (!lineCanvas) return;
  const rect = boardElement.getBoundingClientRect();
  // 设置 canvas 像素尺寸以保证绘制清晰
  lineCanvas.width = rect.width;
  lineCanvas.height = rect.height;
  clearConnectionPath();
}

// 清除连线路径
function clearConnectionPath() {
  if (!lineCtx) return;
  lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
}

// 将 BFS 网格坐标转换为画布坐标
// gr/gc 为扩展后棋盘的行列（0 ~ ROWS+1 / COLS+1）
function gridToCanvasPoint(gr, gc) {
  const boardRect = boardElement.getBoundingClientRect();

  // 普通格子（对应真实 9x9 中的某个格子）
  if (gr >= 1 && gr <= ROWS && gc >= 1 && gc <= COLS) {
    const tile = getTileElement(gr - 1, gc - 1);
    if (!tile) return null;
    const rect = tile.getBoundingClientRect();
    return {
      x: rect.left - boardRect.left + rect.width / 2,
      y: rect.top - boardRect.top + rect.height / 2,
    };
  }

  // 边界格子：贴着最外圈画线即可
  // 取同一列 / 行内最近的格子中心点来估一个位置
  let sampleTile = null;
  let x = 0;
  let y = 0;

  if (gc >= 1 && gc <= COLS) {
    // 同一列找第一行
    sampleTile = getTileElement(0, gc - 1);
  } else if (gc === 0) {
    sampleTile = getTileElement(0, 0);
  } else if (gc === COLS + 1) {
    sampleTile = getTileElement(0, COLS - 1);
  }

  if (sampleTile) {
    const rect = sampleTile.getBoundingClientRect();
    x = rect.left - boardRect.left + rect.width / 2;
  }

  if (gr === 0) {
    y = 0;
  } else if (gr === ROWS + 1) {
    y = boardRect.height;
  } else if (gr >= 1 && gr <= ROWS) {
    const rowTile = getTileElement(gr - 1, 0);
    if (rowTile) {
      const rect = rowTile.getBoundingClientRect();
      y = rect.top - boardRect.top + rect.height / 2;
    }
  }

  return { x, y };
}

// 绘制连线路径（不超过两次拐弯）
function drawConnectionPath(path) {
  if (!lineCtx || !Array.isArray(path) || path.length < 2) return;

  resizeLineCanvas();

  const points = path
    .map((p) => gridToCanvasPoint(p.r, p.c))
    .filter((pt) => pt !== null);

  if (points.length < 2) return;

  lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
  lineCtx.save();
  lineCtx.lineWidth = 3;
  lineCtx.strokeStyle = "rgba(255, 138, 101, 0.9)";
  lineCtx.lineJoin = "round";
  lineCtx.lineCap = "round";
  lineCtx.shadowColor = "rgba(255, 138, 101, 0.5)";
  lineCtx.shadowBlur = 6;

  lineCtx.beginPath();
  lineCtx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    lineCtx.lineTo(points[i].x, points[i].y);
  }
  lineCtx.stroke();
  lineCtx.restore();
}

// 判断两个坐标是否可以连通（不超过两次拐弯），并返回连线路径
// 使用带方向和拐弯次数的 BFS
function findConnectionPath(r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) return null;
  if (board[r1][c1] === 0 || board[r2][c2] === 0) return null;
  if (board[r1][c1] !== board[r2][c2]) return null;

  const R = ROWS + 2;
  const C = COLS + 2;

  // 构造带边框的棋盘，0 表示空
  const grid = Array.from({ length: R }, () => Array(C).fill(0));
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      grid[i + 1][j + 1] = board[i][j];
    }
  }

  const sr = r1 + 1;
  const sc = c1 + 1;
  const tr = r2 + 1;
  const tc = c2 + 1;

  const directions = [
    [1, 0], // 下
    [-1, 0], // 上
    [0, 1], // 右
    [0, -1], // 左
  ];

  // visited[r][c][dir] = 最少拐弯次数
  const visited = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => Array(4).fill(Infinity))
  );
  // prev[r][c][dir] = 上一个状态 { r, c, dir }
  const prev = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => Array(4).fill(null))
  );

  const queue = [];

  function inBounds(rr, cc) {
    return rr >= 0 && rr < R && cc >= 0 && cc < C;
  }

  // 从起点向四个方向探索一格，作为 BFS 的起始状态
  for (let d = 0; d < 4; d++) {
    const [dr, dc] = directions[d];
    const nr = sr + dr;
    const nc = sc + dc;
    if (!inBounds(nr, nc)) continue;

    // 如果不是终点，就必须是空格才能走
    if (!(nr === tr && nc === tc) && grid[nr][nc] !== 0) continue;

    visited[nr][nc][d] = 0;
    // dir: -1 表示来自起点
    prev[nr][nc][d] = { r: sr, c: sc, dir: -1 };
    queue.push({ r: nr, c: nc, dir: d, turns: 0 });
  }

  let endState = null;

  while (queue.length > 0) {
    const { r, c, dir, turns } = queue.shift();

    if (r === tr && c === tc) {
      endState = { r, c, dir };
      break;
    }

    for (let nd = 0; nd < 4; nd++) {
      const [dr, dc] = directions[nd];
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;

      const newTurns = turns + (nd === dir ? 0 : 1);
      if (newTurns > 2) continue;

      // 如果不是终点，就必须是空格才能走
      if (!(nr === tr && nc === tc) && grid[nr][nc] !== 0) continue;

      if (visited[nr][nc][nd] <= newTurns) continue;
      visited[nr][nc][nd] = newTurns;
      prev[nr][nc][nd] = { r, c, dir };
      queue.push({ r: nr, c: nc, dir: nd, turns: newTurns });
    }
  }

  if (!endState) return null;

  // 回溯构造路径（在扩展棋盘坐标中）
  const path = [];
  let cur = endState;

  while (cur) {
    path.push({ r: cur.r, c: cur.c });
    const p = prev[cur.r][cur.c][cur.dir];
    if (!p) break;
    if (p.dir === -1) {
      // 起点
      path.push({ r: p.r, c: p.c });
      break;
    }
    cur = p;
  }

  // 再加一遍起点，保证路径开头一定是起点（sr, sc）
  if (!(path[path.length - 1].r === sr && path[path.length - 1].c === sc)) {
    path.push({ r: sr, c: sc });
  }

  path.reverse();
  return path;
}

function checkWin() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== 0) {
        return;
      }
    }
  }
  const finalMsg =
    "恭喜你完成挑战！小兔子宝宝最最最最最最最棒(๑•̀ㅂ•́)و✧小猪皮会更加努力地守护你哟！你也要相信我们小猪军团，要每天都幸福开心SMILE：）永远守护兔兔的笑颜💪🐰一直一直爱你哟！❤💙💗(●'◡'●)";
  statusElement.textContent = finalMsg;
  textDisplay.textContent = finalMsg;
  if (textPopup) {
    textPopup.classList.add("visible");
  }
}

// 绑定按钮
document.getElementById("restart-btn").addEventListener("click", () => {
  firstSelection = null;
  generateBoard();
  renderBoard();
  textDisplay.textContent = "棋盘已重新生成，开始新的游戏吧。";
  statusElement.textContent = "已重新开始。";
  clearConnectionPath();
});

document.getElementById("clear-text-btn").addEventListener("click", () => {
  textDisplay.textContent = "";
  if (textPopup) {
    textPopup.classList.remove("visible");
  }
});

// 页面加载完成后初始化
window.addEventListener("DOMContentLoaded", () => {
  init();
  resizeLineCanvas();
});

// 浏览器尺寸变化时，重新调整连线路径画布
window.addEventListener("resize", () => {
  resizeLineCanvas();
});

// 点击弹层任意位置关闭文本框
if (textPopup) {
  textPopup.addEventListener("click", (e) => {
    // 防止点击文本内容本身立即关闭
    if (e.target === textPopup) {
      textPopup.classList.remove("visible");
    }
  });
}

