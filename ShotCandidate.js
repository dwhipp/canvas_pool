// Holds details of a potential shot, calculated for computer player.

function ShotCandidate(table, cueball, aimpoint, object_ball, pocket) {
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

  var cueball_to_object_blocked = table.path_blocked(cueball, aimpoint, object_ball);
  if (cueball_to_object_blocked) {
    this.difficulty = 9999;
    return;
  }

  if (!pocket) return;

  var to_aimpoint = aimpoint.difference(cueball.position);
  var to_pocket = pocket.position.difference(object_ball.position);
  this.angle_diff = to_pocket.angle() - to_aimpoint.angle();
  this.pocket_distance = to_pocket.distance_from(to_aimpoint);
  this.aimpoint_distance = to_aimpoint.magnitude();
  this.angular_difficulty = 2 * Math.abs(this.angle_diff) / Math.PI;
  while (this.angular_difficulty > 2) this.angular_difficulty -= 2;

  // Angular difficulty 1.0 implies 90 degrees between cue direction and
  // pocket direction -- i.e. impossible. For other angles, the close the
  // object ball is to the pocket, the simpler the shot becomes.
  // The table width is 1.0, and its length 2.0.
  this.difficulty = this.angular_difficulty * this.pocket_distance * this.pocket_distance;
  var object_ball_to_pocket_blocked = table.path_blocked(object_ball, pocket.aimpoint);
  var ball_distance = cueball.position.distance_from(object_ball.position);

  if (this.aimpoint_distance > ball_distance ||
      this.angular_difficulty > 1.0 ||
      cueball_to_object_blocked || object_ball_to_pocket_blocked) {
    this.difficulty = 999;
  }

  this.strength = this.aimpoint_distance * 0.15 +
      this.pocket_distance * 0.15 * Math.pow(1.6, this.angular_difficulty);
}

ShotCandidate.prototype.shot_vector = function() {
  var aim = this.aimpoint.difference(this.cueball.position);
  var strength = this.strength;
  if (this.table.shot_count == 0) {
    strength = 0.8;
  }
  return aim.unit().scale(strength * -1);
}

