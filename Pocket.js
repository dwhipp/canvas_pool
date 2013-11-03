// Pockets are where balls are potted!

function Pocket( x, y, radius ) {
    this.position = new Vector(x,y);
    this.radius = radius;
    if (x > 0) {
      x -= radius;
    } else if (x < 0) {
      x += radius;
    }
    if (y > 0) {
      y -= radius;
    } else if (y < 0) {
      y += radius;
    }
    this.aimpoint = new Vector(x,y);
}

Pocket.prototype.draw = function (ctx) {
    ctx.save();
    ctx.fillStyle = black;
    ctx.beginPath();
    ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI*2, true );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

