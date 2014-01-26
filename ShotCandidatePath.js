// Records the predicted path of balls for a shot candidate.

function ShotCandidatePath(segments, ball, target) {
  this.segments = segments;
  this.ball = ball;
  this.target = target;
  this.aimpoint = segments[0].start;
}

ShotCandidatePath.prototype.draw = function(ctx) {
  if (!this.segments) return;
  ctx.save();
  ctx.strokeStyle = red;
  if (this.target && this.target.draw) {
    this.target.draw(ctx);
  } else if (this.target && this.target.aimpoint) {
    ctx.fillStyle = red;
    ctx.beginPath();
    var aimpoint = this.target.aimpoint;
    ctx.arc(aimpoint.x, aimpoint.y, this.ball.radius, 0, Math.PI*2, true );
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  for (var i = 0 ; i < this.segments.length; i++) {
    var line = this.segments[i];
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

ShotCandidatePath.target_aimpoint = function(target, object_ball) {
  var target_aimpoint = target.aimpoint;
  if (target.get_aimpoint) {
    target_aimpoint = target.get_aimpoint(object_ball);
  }
  return target_aimpoint;
}

ShotCandidatePath.direct = function(incoming_ball, object_ball, target) {
  var target_aimpoint = ShotCandidatePath.target_aimpoint(target, object_ball);
  var target_to_ball = object_ball.position.difference(target_aimpoint);
  var ball_to_aimpoint =
      target_to_ball.unit().scale(object_ball.radius + incoming_ball.radius);
  var aimpoint = ball_to_aimpoint.add(object_ball.position);
  var segments = [ new Line(aimpoint, target_aimpoint) ];
  return new ShotCandidatePath(segments, object_ball, target);
}

ShotCandidatePath.one_cushion = function(
    incoming_ball, object_ball, target, cushion) {
  if (!cushion) {
    return ShotCandidatePath.direct(incoming_ball, object_ball, target);
  }
  var target_aimpoint = ShotCandidatePath.target_aimpoint(target, object_ball);
  var bouncepoint = cushion.cushion_aimpoint(object_ball, target_aimpoint);
  if (!bouncepoint) return null;
  var cushion_target = { 'aimpoint': bouncepoint };
  var shot_candidate_path =
      ShotCandidatePath.direct(incoming_ball, object_ball, cushion_target);
  shot_candidate_path.segments.push(new Line(bouncepoint, target_aimpoint));
  shot_candidate_path.target = target;
  return shot_candidate_path;
}

ShotCandidatePath.prototype.characterize = function() {
  if (this.target.characterize) {
    this.target.characterize();
  }
  if (this.target.impossible) {
    this.impossible = this.target.impossible;
    return;
  }
  if (this.target.segments) {
    var this_end = this.segments[this.segments.length-1];
    var next_start = this.target.segments[0];
    this.angle_factor = Math.abs(next_start.angle_from(this_end));
    if (this.angle_factor >= Math.PI / 2) {
      this.impossible = "angle_factor: " + this.angle_factor;
      return;
    }
    this.angular_difficulty = 1 / Math.cos(this.angle_factor);
  } else {
    this.angle_factor = 0;
    this.angular_difficulty = 1;
  }
  if (this.target.difficulty) {
    this.difficulty = this.target.difficulty * this.angular_difficulty + 1;
  } else {
    this.difficulty = 0;
  }
  if (this.target.strength) {
    this.strength = this.target.strength * this.angular_difficulty;
    this.carom = this.calc_carom(this.strength);
  } else if (this.target.draw) {
    this.strength = 0;
  } else {
    this.strength = 0.25;
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.difficulty += this.segments[i].length() * (1 + i*2);
    this.strength += this.segments[i].length() / 10 * (1 + i / 8);
  }
  this.difficulty *= Math.sqrt(this.segments.length);
}

ShotCandidatePath.prototype.calc_carom = function(strength) {
  return null;
}

ShotCandidatePath.prototype.blocked = function(table) {
  if (!this.target) {
    return false;
  }
  var cueball = this.ball;
  var object_ball = this.target.ball;
  for (var i = 0; i < this.segments.length; i++) {
    var segment = this.segments[i];
    if (table.path_blocked(cueball, segment.start, segment.end, object_ball)) {
      return true;
    }
  }

  if (this.target.blocked) {
    return this.target.blocked(table);
  }

  return false;
}
