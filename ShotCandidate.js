// Holds details of a potential shot, calculated for computer player.

function ShotCandidate(table, cueball, aimpoint, object_ball, pocket) {
  this.table = table;
  this.aimpoint = aimpoint;
  this.cueball = cueball;
  this.object_ball = object_ball;
  this.pocket = pocket;

  this.difficulty = 0;

  var cueball_to_object_blocked = table.path_blocked(cueball, aimpoint, object_ball);
  if (cueball_to_object_blocked) {
    this.difficulty = 9999;
    return;
  }

  if (!pocket) return;

  var to_aimpoint = aimpoint.difference(cueball.position);
  var to_pocket = pocket.position.difference(object_ball.position);
  var angle_diff = to_pocket.angle() - to_aimpoint.angle();
  var angular_difficulty = 2 * Math.abs(angle_diff) / Math.PI;
  var pocket_distance = to_pocket.distance_from(to_aimpoint);
  var aimpoint_distance = to_aimpoint.magnitude();
  while (angular_difficulty > 2) angular_difficulty -= 2;

  // Angular difficulty 1.0 implies 90 degrees between cue direction and
  // pocket direction -- i.e. impossible. For other angles, the close the
  // object ball is to the pocket, the simpler the shot becomes.
  // The table width is 1.0, and its length 2.0.
  this.difficulty = angular_difficulty * pocket_distance * pocket_distance;
  var object_ball_to_pocket_blocked = table.path_blocked(object_ball, pocket.aimpoint);
  var ball_distance = cueball.position.distance_from(object_ball.position);

  if (aimpoint_distance > ball_distance ||
      angular_difficulty > 1.0 ||
      cueball_to_object_blocked || object_ball_to_pocket_blocked) {
    this.difficulty = 9999;
  }
}
