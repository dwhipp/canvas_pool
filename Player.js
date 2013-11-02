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
    if ( cue_ball.is_valid_location(table) ) {
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

ComputerPlayer.prototype.get_aimpoint_for_pocket = function(ball, pocket, diameter) {
  var pocket_to_ball = ball.difference(pocket);
  var ball_to_aimpoint = pocket_to_ball.unit().scale(diameter);
  return ball.clone().add(ball_to_aimpoint);
}

ComputerPlayer.prototype.get_aimpoint = function(legal_balls, cueball_position) {
  var pockets = this.table.pockets;

  var aimpoints = [];
  var best_distance = 0;
  for (var i = 0; i < legal_balls.length; i++) {
    var ball = legal_balls[i];
    var ball_distance = cueball_position.distance_from(ball.position);
    for (var j = 0; j < pockets.length; j++) {
      var aimpoint = this.get_aimpoint_for_pocket(ball.position, pockets[j].position, ball.radius * 2);
      aimpoint_distance = cueball_position.distance_from(aimpoint);
      var diff = ball_distance - aimpoint_distance;
      if (diff > best_distance) {
        aimpoints.push(aimpoint);
        best_distance = diff;
      }
    }
  }

  if (aimpoints.length == 0) {
    for (var i = 0; i < legal_balls.length; i++) {
      aimpoints.push(legal_balls[i].position);
    }
  }


  var index = Math.floor(Math.random() * aimpoints.length);
  return aimpoints[index];
}

ComputerPlayer.prototype.set_ball_in_hand_position = function(legal_balls) {
  var table = this.table;
  var pockets = table.pockets;
  var cue_ball = table.cue_ball;
  for (var i = 0; i < legal_balls.length; i++) {
    var ball = legal_balls[i];
    for (var j = 0; j < pockets.length; j++) {
      cue_ball.position = this.get_aimpoint_for_pocket(ball.position, pockets[j].position, ball.radius * 3);
      if (cue_ball.is_valid_location(table) ) {
        return;
      }
    }
  }
  // Should never get here!
  cue_ball.position = new Vector(0.75, 0);
}

ComputerPlayer.prototype.begin_shot = function() {
  var table = this.table;
  var game = this.game;

  var legal_balls = this.game.legal_balls(this);

  if (table.ball_in_hand) {
    this.set_ball_in_hand_position(legal_balls);
    table.ball_in_hand = 0;
  }

  var shot_vector;
  if (legal_balls.length > 0) {
    var aimpoint = this.get_aimpoint(legal_balls, table.cue_ball.position);
    var aim = aimpoint.difference(table.cue_ball.position);
    shot_vector = polar_vector( 0.25, aim.angle() + Math.PI );
  } else {
    shot_vector = polar_vector( Math.random(), Math.random() * 2 * Math.PI );
  }

  shot_vector.add(table.cue_ball.position);
  table.begin_shot(table.cue_ball.position);
  table.commit_shot(shot_vector);
}
