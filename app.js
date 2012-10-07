var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var FPS = 60;
var frame = Math.floor(1000/FPS);
var MAX_SPEED = 16;

var circles = [];
var dragged_circle = null;
var sx, sy, mx, my, ex, ey;
var rfl = 0.9;
var time, start_time;

function drawBg() {
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();
}

function square(value) {
  return value * value;
}

var Circle = (function() {
  function Circle(x, y, dx, dy) {
    this.rad = 6;
    this.x = x ? x : Math.floor(Math.random() * (canvas.width - this.rad * 2)) + this.rad;
    this.y = y ? y : Math.floor(Math.random() * (canvas.height - this.rad * 2)) + this.rad;
    this.dx = dx ? dx : (Math.floor(Math.random() * 20) - 10) / 10;
    this.dy = dy ? dy : (Math.floor(Math.random() * 20) - 10) / 10;
    this.color = "hsl(" + Math.floor(Math.random()*360) + ",100%,70%)";
    this.dragged = false;
  }

  Circle.prototype.update = function(x, y, dx, dy) {
    this.dx = dx ? dx : this.dx;
    this.dy = dy ? dy : this.dy;
    this.x = x ? x : this.x + this.dx;
    this.y = y ? y : this.y + this.dy;
    if ((this.x + this.rad > canvas.width && this.dx > 0) || (this.x - this.rad < 0 && this.dx < 0)) {
      this.dx *= -rfl;
    }
    if ((this.y + this.rad > canvas.height && this.dy > 0) || (this.y - this.rad < 0 && this.dy < 0)) {
      this.dy *= -rfl;
    }
  };

  Circle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.rad, 0, Math.PI*2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  };

  Circle.prototype.judgePointer = function(x, y) {
    return this.rad >= Math.sqrt(square(this.x - x) + square(this.y - y));
  };

  Circle.prototype.checkCollision = function(from_idx) {
    for (var i = from_idx + 1, len = circles.length; i < len; ++i) {
      var _circle = circles[i];
      var vx = this.x - _circle.x;
      var vy = this.y - _circle.y;
      var adnm = square(vx) + square(vy);
      var point_distance = Math.sqrt(adnm);
      var caved_distance = this.rad + _circle.rad - point_distance;
      if (caved_distance >= 0) {
        if (point_distance > 0) {
          point_distance = 1 / point_distance;
        }
        var params = calcCollision(this, _circle, vx, vy, adnm);
        var ax = (vx * point_distance * caved_distance * 0.5);
        var ay =  (vy * point_distance * caved_distance * 0.5);

        this.x += ax; 
        this.y += ay;
        circles[i].x -= ax;
        circles[i].y -= ay;

        this.dx = params.a_dx;
        this.dy = params.a_dy;
        circles[i].dx = params.b_dx;
        circles[i].dy = params.b_dy;
      }
    }
  };

  return Circle;
})();

function calcCollision(a, b, vx, vy, adnm) {
  var adjust_value = 1;

  adjust_value = -1 * (vx * a.dx + vy * a.dy) / adnm;
  var a_rx = a.dx + vx * adjust_value;
  var a_ry = a.dy + vy * adjust_value;

  adjust_value = -1 * (-vy * a.dx + vx * a.dy) / adnm;
  var a_mx = a.dx - vy * adjust_value;
  var a_my = a.dy + vx * adjust_value;

  adjust_value = -1 * (vx * b.dx + vy * b.dy) / adnm;
  var b_rx = b.dx + vx * adjust_value;
  var b_ry = b.dy + vy * adjust_value;

  adjust_value = -1 * (-vy * b.dx + vx * b.dy) / adnm;
  var b_mx = b.dx - vy * adjust_value;
  var b_my = b.dy + vx * adjust_value;

  var a_sx = (a_mx + b_mx - a_mx * rfl + b_mx * rfl) / 2; 
  var a_sy = (a_my + b_my - a_my * rfl + b_my * rfl) / 2;

  var b_sx = (a_mx - b_mx) * rfl + a_sx;
  var b_sy = (a_my - b_my) * rfl + a_sy;

  var params = {
    a_dx: a_sx + a_rx,
    a_dy: a_sy + a_ry,
    b_dx: b_sx + b_rx,
    b_dy: b_sy + b_ry
  };
  return params;
}

function tapStart(e) {
  sx = e.clientX;
  sy = e.clientY;
  start_time = e.timeStamp;
  for (var i = 0, len = circles.length; i < len; ++i) {
    if (circles[i].judgePointer(sx, sy)) {
      dragged_circle = circles[i];
      break;
    }
  }
  if (!dragged_circle) {
    dragged_circle = new Circle(sx, sy, 0, 0);
    circles.push(dragged_circle);
  }
}

function tapMove(e) {
  mx = e.clientX;
  my = e.clientY;
  if (dragged_circle) {
    dragged_circle.update(mx, my);
  }
}

function tapEnd(e) {
  ex = mx - sx;
  ey = my - sy;
  time = e.timeStamp - start_time;
  var speedX = Math.floor((ex / time) * 10);
  var speedY = Math.floor((ey / time) * 10);
  if (speedX > MAX_SPEED || speedX < -MAX_SPEED) {
    speedX = MAX_SPEED;
  }
  if (speedY > MAX_SPEED || speedY < -MAX_SPEED) {
    speedY = MAX_SPEED;
  }
  if (dragged_circle) {
    dragged_circle.update(mx, my, speedX, speedY);
  }
  dragged_circle = null;
}

function loop() {
  drawBg();
  for (var i = 0, len = circles.length; i < len; ++i) {
    circles[i].checkCollision(i);
    if (!dragged_circle || circles[i] !== dragged_circle) {
      circles[i].update();
    }
    circles[i].draw();
  }
}

function init() {
  for (var i = 0; i < 100; i++) {
    circles.push(new Circle());
  }
  setInterval(function() {
    loop();
  }, frame);

  canvas.addEventListener('mousedown', tapStart, false);
  canvas.addEventListener('mousemove', tapMove, false);
  canvas.addEventListener('mouseup', tapEnd, false);
  canvas.addEventListener('mouseout', tapEnd, false);
}
init();
