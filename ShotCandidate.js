// Holds details of a potential shot, calculated for computer player.

function ShotCandidate(
    table, cueball, cueball_cushion, aimpoint, object_ball, pocket) {
  this.table = table;
  this.aimpoint = aimpoint;
  this.cueball = cueball;
  this.object_ball = object_ball;
  this.pocket = pocket;

  this.difficulty = 0;
  this.strength = 0.25;

  if (!object_ball) {
    return;
  }

  if (cueball_cushion) {
    this.cueball_cushion = cueball_cushion;
    var bouncepoint = cueball_cushion.cushion_aimpoint(cueball, aimpoint);
    if (bouncepoint == null) {
      this.difficulty = 8002;
      return;
    }
    this.aimpoint = bouncepoint;
    var cueball_to_bounce_is_blocked = table.path_blocked(
        cueball, cueball.position, bouncepoint, object_ball);
    if (table.path_blocked(cueball, cueball.position, bouncepoint, object_ball)) {
      this.difficulty = 8000;
      return;
    }
    if (table.path_blocked(cueball, bouncepoint, object_ball.position, object_ball)) {
      this.difficulty = 8001;
      return;
    }

    var a = cueball.position.distance_from(bouncepoint);
    var b = object_ball.position.distance_from(bouncepoint);

    this.difficulty = (a+b)/2;
    return;
  }

  this.cueball_to_aimpoint = aimpoint.difference(cueball.position);
  this.aimpoint_to_object_ball = object_ball.position.difference(aimpoint);
  this.collision_tangent = this.aimpoint_to_object_ball.normal().unit();
  this.collision_tangent.scale(
      this.collision_tangent.dot_product(this.cueball_to_aimpoint.unit()));

  this.final_destination = this.collision_tangent.add(aimpoint);

  var cueball_to_object_blocked = table.path_blocked(
      cueball, cueball.position, aimpoint, object_ball);

  if (cueball_to_object_blocked) {
    this.difficulty = 9999;
    return;
  }

  var to_aimpoint = this.cueball_to_aimpoint;
  this.aimpoint_distance = to_aimpoint.magnitude();
  var ball_distance = cueball.position.distance_from(object_ball.position);

  if (this.aimpoint_distance > ball_distance) {
    this.difficulty = 9998;
    return;
  }

  if (!pocket)  {
    if (table.collision_would_pot_cueball(this)) {
      this.difficulty = 9997;
    }
    return;
  }

  var to_pocket = pocket.position.difference(object_ball.position);
  this.angle_diff = to_pocket.angle() - to_aimpoint.angle();
  this.pocket_distance = to_pocket.distance_from(to_aimpoint);
  this.angular_difficulty = 2 * Math.abs(this.angle_diff) / Math.PI;
  while (this.angular_difficulty > 2) this.angular_difficulty -= 2;

  // Angular difficulty 1.0 implies 90 degrees between cue direction and
  // pocket direction -- i.e. impossible. For other angles, the close the
  // object ball is to the pocket, the simpler the shot becomes.
  // The table width is 1.0, and its length 2.0.
  this.difficulty =
      this.angular_difficulty * this.pocket_distance * this.pocket_distance;
  var object_ball_to_pocket_blocked = table.path_blocked(
      object_ball, object_ball.position, pocket.aimpoint);

  if (this.angular_difficulty > 1.0 ||
      cueball_to_object_blocked || object_ball_to_pocket_blocked) {
    this.difficulty = 9996;
  } else if (table.collision_would_pot_cueball(this)) {
    this.difficulty = 9995;
  }

  this.strength = this.aimpoint_distance * 0.15 +
      this.pocket_distance * 0.15 * Math.pow(1.6, this.angular_difficulty);
}

ShotCandidate.direct_shot = function(
    table, cueball, object_ball, pocket) {
  var aimpoint = pocket.get_aimpoint(cueball, object_ball);
  return new ShotCandidate(table, cueball, null, aimpoint, object_ball, pocket);
}

ShotCandidate.pocketless_shot = function(
    table, cueball, aimpoint, object_ball) {
  return new ShotCandidate(table, cueball, null, aimpoint, object_ball, null);
}

ShotCandidate.random_shot = function(table, cueball, random_aimpoint) {
  return new ShotCandidate(
      table, cueball, null, random_aimpoint, null, null);
}

ShotCandidate.cueball_cushion_shot = function(
    table, cueball, cushion, aimpoint, object_ball) {
  return new ShotCandidate(
      table, cueball, cushion, aimpoint, object_ball, null);
}

ShotCandidate.sort_by_difficulty = function(a,b) {
  return a.difficulty - b.difficulty
}

ShotCandidate.prototype.is_easy = function() {
  return this.difficulty < 0.2;
}

ShotCandidate.prototype.is_possible = function() {
  return this.difficulty < 10;
}

ShotCandidate.prototype.shot_vector = function() {
  var aim = this.aimpoint.difference(this.cueball.position);
  var strength = this.strength;
  if (this.table.is_break_shot) {
    strength = 0.8;
  }
  return aim.unit().scale(strength * -1).add(this.cueball.position);
}

ShotCandidate.prototype.draw = function(ctx) {
  var aim = this.aimpoint;
  if (!aim) return;
  ctx.strokeStyle = gray;
  ctx.lineWidth = 0.003;
  ctx.beginPath();
  ctx.arc( aim.x, aim.y, this.cueball.radius, 0, Math.PI*2, true );
  ctx.closePath();
  ctx.stroke();

  var end = this.final_destination;
  if (!end) return;
  ctx.beginPath();
  ctx.moveTo(aim.x,aim.y);
  ctx.lineTo(end.x,end.y);
  ctx.closePath();
  ctx.stroke();
}

ShotCandidate.prototype.begin_shot = function(shot) {
  var table = this.table;
  table.shot_candidate = this;
  shot.set_cueball_strikepoint(this.cueball, this.cueball.position);
  shot.adjust(this.shot_vector());
}

ShotCandidate.prototype.commit_shot = function(shot) {
  if (DEBUG) console.log("commit", this);
  this.begin_shot(shot);
  var table = this.table;
  table.commit_shot();
  table.shot_candidate = null;
}
