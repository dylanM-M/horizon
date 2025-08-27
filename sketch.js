// === Canvas settings ===
let CANVAS_W, CANVAS_H;
let margin = 9;
let numRects = 8;
let rectWidth;
let rects = [];
let minHeight = margin;

// === Color theme (edit these only) ===
// Use [r, g, b, a] with alpha 0–255 (omit a for 255)
const THEME = {
  background: [17, 17, 30],
  bgStart:    [35, 230, 35, 0],
  bgEnd:      [0, 0, 255, 120],
  rectStart:  [35, 230, 35, 0],
  rectEnd:    [255, 255, 255, 255],
};

// Will hold p5.Color objects (populated in setup)
const PALETTE = {
  background: null,
  bgStart: null,
  bgEnd: null,
  rectStart: null,
  rectEnd: null,
};

// === Background gradient properties ===
let bgPower = 1;
let bgStartPower = 1;
let bgDragging = false;
let bgStartMouseY = 0;

function setup() {
  // create canvas that fills iframe
  CANVAS_W = windowWidth;
  CANVAS_H = windowHeight;
  createCanvas(CANVAS_W, CANVAS_H);

  rectWidth = (CANVAS_W - margin * (numRects + 1)) / numRects;

  // Convert THEME to p5.Color after p5 is ready
  const toCol = (arr) => color(arr[0], arr[1], arr[2], arr[3] ?? 255);
  PALETTE.background = toCol(THEME.background);
  PALETTE.bgStart    = toCol(THEME.bgStart);
  PALETTE.bgEnd      = toCol(THEME.bgEnd);
  PALETTE.rectStart  = toCol(THEME.rectStart);
  PALETTE.rectEnd    = toCol(THEME.rectEnd);

  // Randomize initial background gradient power
  bgPower = random(0.5, 2);

  for (let i = 0; i < numRects; i++) {
    let x = margin * (i + 1) + rectWidth * i;
    let h = random(minHeight, CANVAS_H - 2 * margin);
    let y = random(margin, CANVAS_H - margin - h);
    let gradPower = random(0.5, 2);

    rects.push(makeRect({
      x, y, w: rectWidth, h,
      resizeMode: "vertical",
      c1: PALETTE.rectStart,
      c2: PALETTE.rectEnd,
      gradPower,
    }));
  }
  initializeRects();
}

function windowResized() {
  // recalc canvas size
  CANVAS_W = windowWidth;
  CANVAS_H = windowHeight;
  resizeCanvas(CANVAS_W, CANVAS_H);

  rectWidth = (CANVAS_W - margin * (numRects + 1)) / numRects;

  // optionally reposition or rescale rectangles
  for (let i = 0; i < rects.length; i++) {
    let r = rects[i];
    r.x = margin * (i + 1) + rectWidth * i;
    r.w = rectWidth;
    r.h = constrain(r.h, minHeight, CANVAS_H - 2 * margin);
    r.y = constrain(r.y, margin, CANVAS_H - margin - r.h);
  }
}

function initializeRects() {
  const toCol = (arr) => color(arr[0], arr[1], arr[2], arr[3] ?? 255);
  PALETTE.background = toCol(THEME.background);
  PALETTE.bgStart    = toCol(THEME.bgStart);
  PALETTE.bgEnd      = toCol(THEME.bgEnd);
  PALETTE.rectStart  = toCol(THEME.rectStart);
  PALETTE.rectEnd    = toCol(THEME.rectEnd);

  bgPower = random(0.5, 2);

  for (let i = 0; i < numRects; i++) {
    let x = margin * (i + 1) + rectWidth * i;
    let h = random(minHeight, CANVAS_H - 2 * margin);
    let y = random(margin, CANVAS_H - margin - h);
    let gradPower = random(0.5, 2);

    rects.push(makeRect({
      x, y, w: rectWidth, h,
      resizeMode: "vertical",
      c1: PALETTE.rectStart,
      c2: PALETTE.rectEnd,
      gradPower,
    }));
  }
}

function makeRect(opts) {
  return {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    dragging: false, dragFromTop: false,
    startMouseY: 0, startMouseX: 0,
    startHeight: 0, startY: 0,
    startGradPower: opts.gradPower || 1,
    gradPower: opts.gradPower || 1,
    resizeMode: opts.resizeMode || "vertical",
    c1: opts.c1, c2: opts.c2,
  };
}

function draw() {
  background(PALETTE.background);
  drawBackgroundGradient();
  for (let r of rects) drawGradientRect(r);
}

function drawBackgroundGradient() {
  noFill();
  for (let j = 0; j <= CANVAS_H; j++) {
    let inter = map(j, 0, CANVAS_H, 0, 1);
    inter = pow(inter, bgPower);
    let c = lerpColor(PALETTE.bgStart, PALETTE.bgEnd, inter);
    stroke(c);
    line(0, j, CANVAS_W, j);
  }
}

function drawGradientRect(r) {
  noFill();
  for (let i = 0; i < r.w; i++) {
    let inter = map(i, 0, r.w, 0, 1);
    inter = pow(inter, r.gradPower);
    let c = lerpColor(r.c1, r.c2, inter);
    stroke(c);
    line(r.x + i, r.y, r.x + i, r.y + r.h);
  }
}

function mousePressed() {
  let clickedOnRect = false;
  for (let r of rects) {
    if (mouseX > r.x && mouseX < r.x + r.w &&
        mouseY > r.y && mouseY < r.y + r.h) {
      r.dragging = true;
      r.startMouseY = mouseY;
      r.startMouseX = mouseX;
      r.startHeight = r.h;
      r.startY = r.y;
      r.startGradPower = r.gradPower;
      r.dragFromTop = mouseY < r.y + r.h / 2;
      clickedOnRect = true;
    }
  }
  if (!clickedOnRect) {
    bgDragging = true;
    bgStartMouseY = mouseY;
    bgStartPower = bgPower;
  }
}

function mouseDragged() {
  for (let r of rects) {
    if (!r.dragging) continue;

    let dy = mouseY - r.startMouseY;
    let dx = mouseX - r.startMouseX;

    // vertical resize
    if (r.resizeMode === "vertical") {
      if (r.dragFromTop) {
        let newY = r.startY + dy;
        let newHeight = r.startHeight - dy;
        newY = max(margin, newY);
        newHeight = (r.startY + r.startHeight) - newY;
        newHeight = min(newHeight, (CANVAS_H - margin) - newY);
        if (newHeight >= minHeight) {
          r.y = newY;
          r.h = newHeight;
        }
      } else {
        let newHeight = r.startHeight + dy;
        let bottomEdge = r.startY + newHeight;
        if (bottomEdge > CANVAS_H - margin) {
          newHeight = (CANVAS_H - margin) - r.startY;
        }
        r.h = max(newHeight, minHeight);
      }
    }

    // horizontal gradient power
    let sensitivity = 0.01;
    r.gradPower = max(0.1, r.startGradPower + dx * sensitivity);
  }

  // background drag
  if (bgDragging) {
    let dy = mouseY - bgStartMouseY;
    let sensitivity = 0.01;
    bgPower = max(0.1, bgStartPower + dy * sensitivity);
  }
}

function mouseReleased() {
  for (let r of rects) r.dragging = false;
  bgDragging = false;
}
