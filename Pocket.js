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

Pocket.prototype.shot_would_pot_cueball = function(shot_candidate) {
  var cueball = shot_candidate.cueball;
  var aimpoint = shot_candidate.aimpoint;
  var object_ball = shot_candidate.object_ball;
  var final_destination = shot_candidate.final_destination;

  // no in-off from hanging ball
  if (this.aimpoint.distance_from(object_ball.position) < object_ball.radius ||
      this.position.distance_from(object_ball.position) < object_ball.radius) {
    return false;
  }

  var distance_from_pocket =
      this.position.distance_from_line(aimpoint, final_destination);
  if (distance_from_pocket != null &&
      distance_from_pocket < this.radius + cueball.radius) {
    return true;
  }

  var distance_from_pocket_aimpoint =
      this.aimpoint.distance_from_line(aimpoint, final_destination);
  if (distance_from_pocket_aimpoint != null &&
      distance_from_pocket_aimpoint < this.radius) {
    return true;
  }

  return false;
}


Pocket.prototype.get_aimpoint = function(cueball, object_ball) {
  var pocket_to_ball = object_ball.position.difference(this.aimpoint);
  var ball_to_aimpoint = pocket_to_ball.unit().scale(object_ball.radius + cueball.radius);
  return ball_to_aimpoint.add(object_ball.position);
}

Pocket.prototype.get_ball_in_hand_candidate = function(cueball, object_ball) {
  var pocket_to_ball = object_ball.position.difference(this.aimpoint);
  var angle = pocket_to_ball.angle() + (Math.random() - 0.5) * Math.PI / 2;
  var magnitude = (1 + Math.random() * 3) * (object_ball.radius + cueball.radius);
  return polar_vector(magnitude, angle).add(object_ball.position);
}
