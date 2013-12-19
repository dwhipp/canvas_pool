// Holds details of a potential shot, calculated for computer player.

function ShotCandidate(table, cueball, cueball_cushion, object_path) {
  this.table = table;
  this.cueball = cueball;
  this.aimpoint = object_path.aimpoint;
  this.object_ball = object_path.ball;

  this.difficulty = 0;
  this.strength = 0.25;

  if (!this.object_ball) {
    this.path = object_path;
    return;
  }

  var cueball_segments = null;
  if (cueball_cushion) {
    var bouncepoint =
        cueball_cushion.cushion_aimpoint(cueball, object_path.aimpoint);
    if (bouncepoint) {
      cueball_segments = [ new Line(cueball.position, bouncepoint),
                           new Line(bouncepoint, object_path.aimpoint) ];
    } else {
      this.impossible = "no cueball bouncepoint for cushion";
      return;
    }
  } else {
    cueball_segments = [ new Line(cueball.position, object_path.aimpoint) ];
  }

  this.path = new ShotCandidatePath(cueball_segments, cueball, object_path);

  if (this.path.blocked(table)) {
    this.impossible = "cueball path blocked";
    return;
  }

  this.path.characterize();
  if (this.path.impossible) {
    this.impossible = this.path.impossible;
    return;
  }

  this.strength = this.path.strength;
  this.difficulty = this.path.difficulty;

  var aimpoint = this.aimpoint;
  this.cueball_to_aimpoint = aimpoint.difference(cueball.position);
  this.aimpoint_to_object_ball = this.object_ball.position.difference(aimpoint);
  this.collision_tangent = this.aimpoint_to_object_ball.normal().unit();
  this.collision_tangent.scale(
      this.collision_tangent.dot_product(this.cueball_to_aimpoint.unit()));

  this.cueball_destination = this.collision_tangent.add(aimpoint);

  if (table.collision_would_pot_cueball(this)) {
    this.impossible = "would pot cueball";
    return;
  }

  if (this.strength > .8) {
    this.impossible = "requires too much strength";
    return;
  }
}

ShotCandidate.direct_shot = function(
    table, cueball, object_ball, pocket) {
  var path = ShotCandidatePath.direct(cueball, object_ball, pocket);
  return new ShotCandidate(table, cueball, null, path);
}

ShotCandidate.pocketless_shot = function(
    table, cueball, aimpoint, object_ball) {
  var target = { 'aimpoint': aimpoint };
  var path = ShotCandidatePath.direct(cueball, object_ball, target);
  return new ShotCandidate(table, cueball, null, path);
}

ShotCandidate.random_shot = function(table, cueball, random_aimpoint) {
  var target = { 'aimpoint': random_aimpoint };
  return new ShotCandidate(table, cueball, null, target);
}

ShotCandidate.cueball_cushion_shot = function(
    table, cueball, cushion, target, object_ball) {
  var path = ShotCandidatePath.direct(cueball, object_ball, target);
  return new ShotCandidate(table, cueball, cushion, path);
}

ShotCandidate.sort_by_difficulty = function(a,b) {
  return a.difficulty - b.difficulty
}

ShotCandidate.prototype.is_easy = function() {
  return this.difficulty < 2.5;
}

ShotCandidate.prototype.is_moderate = function() {
  return this.difficulty < 10;
}

ShotCandidate.prototype.is_possible = function() {
  return !this.impossible;
}

ShotCandidate.prototype.shot_vector = function() {
  var aim = this.aimpoint;
  if (this.path.segments) {
    aim = this.path.segments[0].end.difference(this.cueball.position);
  }
  var strength = this.strength;
  if (this.table.is_break_shot) {
    strength = 0.8;
  }
  return aim.unit().scale(strength * -1).add(this.cueball.position);
}

ShotCandidate.prototype.draw = function(ctx) {
  ctx.strokeStyle = gray;
  ctx.lineWidth = 0.003;

  if (this.path && this.path.draw) {
    this.path.draw(ctx);
  }

  var aim = this.aimpoint;
  if (!aim) return;
  ctx.beginPath();
  ctx.arc( aim.x, aim.y, this.cueball.radius, 0, Math.PI*2, true );
  ctx.closePath();
  ctx.stroke();

  var end = this.cueball_destination;
  if (!end) return;
  ctx.beginPath();
  ctx.moveTo(aim.x,aim.y);
  ctx.lineTo(end.x,end.y);
  ctx.closePath();
  ctx.stroke();

  if (this.path && this.path.draw) {
    this.path.draw(ctx);
  }
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
