// Players. Human players obey mouse commands; Computer plays have their own
// strategies.

function Player() {}

function Player_ctor(player, name, cue) {
  player.name = name;
  player.ball_color = false;
  player.cue_color = cue;
}

Player.prototype.join_game = function(game, table) {
  this.game = game;
  this.table = table;
}

Player.prototype.mouse_down = function(vec) {}
Player.prototype.mouse_up = function(vec) {}
Player.prototype.mouse_move = function(vec) {}

Player.prototype.begin_shot = function() {
  // console.log("BEGIN: " + this.name);
}

// -- Human --

function HumanPlayer(name, cue) {
  Player_ctor(this, name, cue);
}

HumanPlayer.prototype = new Player();

HumanPlayer.prototype.mouse_down = function(vec) {
  var table = this.table;
  if (!table.ball_in_hand) {
    table.begin_shot(vec);
  }
}

HumanPlayer.prototype.mouse_up = function(vec) {
  var table = this.table;
  if (table.ball_in_hand) {
    var cue_ball = table.cue_ball;
    cue_ball.position = vec;
    if ( cue_ball.is_legal_ball_in_hand_position(table) ) {
      table.ball_in_hand = 0;
    }
  }
  else {
    table.commit_shot( vec );
  }
}

HumanPlayer.prototype.mouse_move = function(vec) {
  var table = this.table;
  if (table.ball_in_hand) {
    table.cue_ball.position = vec;
  }
  else {
    table.adjust_shot( vec );
  }
}

// -- Computer --

function ComputerPlayer(name, cue) {
  Player_ctor(this, name, cue);
}

ComputerPlayer.prototype = new Player();

ComputerPlayer.prototype.get_aimpoint_for_pocket = function(ball_position, pocket, diameter) {
  var pocket_aimpoint = pocket.aimpoint;
  var pocket_to_ball = ball_position.difference(pocket_aimpoint);
  var ball_to_aimpoint = pocket_to_ball.unit().scale(diameter);
  return ball_to_aimpoint.add(ball_position);
}

ComputerPlayer.prototype.get_aimpoints = function(legal_balls, cueball, has_easy) {
  var pockets = this.table.pockets;

  var easy = [];
  var hard = [];
  var hardest = 2;
  for (var i = 0; i < legal_balls.length; i++) {
    var ball = legal_balls[i];
    var ball_distance = cueball.position.distance_from(ball.position);
    for (var j = 0; j < pockets.length; j++) {
      var aimpoint = this.get_aimpoint_for_pocket(
          ball.position, pockets[j], ball.radius * 2);
      var to_aimpoint = aimpoint.difference(cueball.position);
      var to_pocket = pockets[j].position.difference(ball.position);
      var angle_diff = to_pocket.angle() - to_aimpoint.angle();
      var angular_difficulty = 2 * Math.abs(angle_diff) / Math.PI;
      var pocket_distance = to_pocket.distance_from(to_aimpoint);
      var aimpoint_distance = to_aimpoint.magnitude();

      while (angular_difficulty > 2) angular_difficulty -= 2;

      // Angular difficulty 1.0 implies 90 degrees between cue direction and
      // pocket direction -- i.e. impossible. For other angles, the close the
      // object ball is to the pocket, the simpler the shot becomes.
      // The table width is 1.0, and its length 2.0.
      var difficulty = angular_difficulty * pocket_distance * pocket_distance;
      var cueball_to_object_blocked = this.path_blocked(cueball, aimpoint, ball);
      var object_ball_to_pocket_blocked = this.path_blocked(ball, pockets[j].position);

      if (aimpoint_distance > ball_distance ||
          angular_difficulty > 1.0 ||
          cueball_to_object_blocked || object_ball_to_pocket_blocked) {
        // avoid this
      } else if (difficulty < .07) {
        // console.log("easy: ", difficulty, angular_difficulty, pocket_distance);
        easy.push(aimpoint);
      } else if (difficulty < hardest) {
        // console.log("hard: ", difficulty, angular_difficulty, pocket_distance);
        hardest = difficulty;
        hard.push(aimpoint);
      } else {
        // console.log("harder: ", difficulty, angular_difficulty, pocket_distance);
      }
    }
  }

  if (has_easy) {
    return easy.length > 0;
  }

  if (easy.length + hard.length == 0) {
    for (var i = 0; i < legal_balls.length * 20; i++) {
      var ball = legal_balls[i % legal_balls.length];
      var offset = polar_vector(
          Math.random() * ball.radius * 1.9, Math.random() * 2 * Math.PI );
      var aimpoint = offset.add(ball.position);
      if (this.path_blocked(cueball, aimpoint, ball)) {
        // console.log("random nasty");
        if (hard.length < legal_balls.length) {
          hard.push(aimpoint);
        }
      } else {
        // console.log("random open");
        if (easy.length < legal_balls.length * 2) {
          easy.push(aimpoint);
        } else {
          break;
        }
      }
    }
  }

  var aimpoints = [];
  if (easy.length > 0) {
    aimpoints = easy;
  } else {
    aimpoints = hard;
  }

  return aimpoints;
}

ComputerPlayer.prototype.path_blocked = function(ball_at_start, target, ball_at_target) {
  var table = this.table;
  var balls = table.balls;
  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if (ball != ball_at_start && ball != ball_at_target &&
        ball.blocks_path(ball_at_start.position, target)) {
      return true;
    }
  }
  return false;
}

ComputerPlayer.prototype.set_ball_in_hand_position = function(legal_balls) {
  var table = this.table;
  var pockets = table.pockets;
  var cue_ball = table.cue_ball;
  var positions = [];
  for (var i = 0; i < legal_balls.length * 5; i++) {
    var ball = legal_balls[i % legal_balls.length];
    for (var j = 0; j < pockets.length; j++) {
      var position = this.get_aimpoint_for_pocket(
          ball.position, pockets[j], ball.radius * 2 * (1 + Math.random() * 3));
      if (cue_ball.is_legal_ball_in_hand_position(table, position) ) {
        cue_ball.position = position;
        if (this.get_aimpoints(legal_balls, cue_ball, 'has_easy')) {
          positions.push(position);
        }
      }
    }
  }
  if (positions.length == 0) {
    var bbox = table.legal_ball_in_hand_bounding_box();
    var width = bbox.right - bbox.left - 2 * cue_ball.radius;
    var height = bbox.bottom - bbox.top - 2 * cue_ball.radius;
    var x = bbox.left + (Math.random() * width) + cue_ball.radius;
    var y = bbox.top + (Math.random() * height) + cue_ball.radius;
    positions = [ new Vector(x, y) ];
  }

  var index = Math.floor(Math.random() * positions.length);
  cue_ball.position = positions[index];
}

ComputerPlayer.prototype.begin_shot = function() {
  var table = this.table;
  var game = this.game;

  var legal_balls = this.game.legal_balls(this);
  // console.log("BEGIN COMPUTER SHOT");

  if (table.ball_in_hand) {
    this.set_ball_in_hand_position(legal_balls);
    table.ball_in_hand = 0;
  }

  var aimpoints = this.get_aimpoints(legal_balls, table.cue_ball);

  var shot_vectors = [];
  for (var i = 0; i < aimpoints.length; i++) {
    var aim = aimpoints[i].difference(table.cue_ball.position);
    shot_vectors.push(polar_vector(0.25, aim.angle() + Math.PI));
  }

  if (shot_vectors.length == 0) {
    shot_vectors.push(polar_vector(Math.random(), Math.random() * 2 * Math.PI));
  }

  for (var i = 0; i < shot_vectors.length; i++) {
    shot_vectors[i].add(table.cue_ball.position);
  }

  var delay = 700;
  setTimeout(function() {
    table.begin_shot(table.cue_ball.position);
    table.adjust_shot(shot_vectors[0].clone());
  }, delay);

  var shots_to_show = shot_vectors.length;
  if (shots_to_show > 5) {
    shots_to_show = 5;
  }

  function preview_shot(shot_vector) {
    delay += 500;
    setTimeout(function() {
      table.adjust_shot(shot_vector.clone()) }, delay);
  }

  for (var i = 1; i < shots_to_show; i++) {
    preview_shot(shot_vectors[i % shot_vectors.length]);
  }

  var index = Math.floor(Math.random() * shot_vectors.length);
  var shot_vector = shot_vectors[index].clone();

  delay += 500;
  setTimeout(function() { table.adjust_shot(shot_vector.clone()) }, delay);
  delay += 500;
  setTimeout(function() { table.commit_shot(shot_vector.clone()) }, delay);
}
