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
  this.game.force_position_for_testing();
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

ComputerPlayer.prototype.get_direct_shots = function(legal_balls, cueball) {
  var pockets = this.table.pockets;
  var candidates = [];
  for (var i = 0; i < legal_balls.length; i++) {
    var ball = legal_balls[i];
    for (var j = 0; j < pockets.length; j++) {
      var pocket = pockets[j];
      var aimpoint = this.get_aimpoint_for_pocket(ball.position, pocket, ball.radius * 2);
      var candidate = new ShotCandidate(this.table, cueball, aimpoint, ball, pocket);
      if (candidate.is_possible()) {
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

ComputerPlayer.prototype.get_random_shots = function(legal_balls, cueball, count) {
  var candidates = [];
  for (var i = 0; i < count; i++) {
    var ball = legal_balls[i % legal_balls.length];
    var offset = polar_vector(
        Math.random() * ball.radius * 1.9, Math.random() * 2 * Math.PI );
    var aimpoint = offset.add(ball.position);
    var candidate = new ShotCandidate(this.table, cueball, aimpoint, ball, null);
    if (candidate.is_possible()) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

ComputerPlayer.prototype.partition_candidates = function(candidates, is_easy_fn) {
  var easy = [];
  var hard = [];

  for (var i = 0; i < candidates.length; ++i)  {
    if (is_easy_fn(candidates[i])) {
      easy.push(candidates[i]);
    } else {
      hard.push(candidates[i]);
    }
  }

  return {'easy': easy, 'hard' : hard};
}

ComputerPlayer.prototype.get_shot_condidates = function(legal_balls, cueball, has_easy) {
  var candidates = this.get_direct_shots(legal_balls, cueball);

  candidates.sort(ShotCandidate.sort_by_difficulty);

  if (has_easy) {
    return candidates.length != 0 && candidates[0].is_easy();
  }

  if (candidates.length > 0) {
    var partitions = this.partition_candidates(candidates, function(a){return a.is_easy()});
    console.log("Candidates: ", partitions.easy.length, candidates);

    if (partitions.easy.length > 0) {
      return partitions.easy;
    }
    if (partitions.hard.length > 0) {
      return [ partitions.hard[0] ];
    }
  }

  candidates = this.get_random_shots(
      legal_balls, cueball, legal_balls.length * 20);
  var partitions = this.partition_candidates(
      candidates, function(a){return a.difficulty < 1});

  if (partitions.easy.length > 0) {
    return partitions.easy;
  }
  if (partitions.hard.length > 0) {
    return partitions.hard;
  }

  var random_aimpoint = new Vector(Math.random() * 2 - 1, Math.random() - 0.5);
  console.log("RANDOM: ", random_aimpoint);
  return [new ShotCandidate(this.table, cueball, random_aimpoint, null, null)];
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
        if (this.get_shot_condidates(legal_balls, cue_ball, 'has_easy')) {
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

  game.force_position_for_testing();

  var legal_balls = this.game.legal_balls(this);
  // console.log("BEGIN COMPUTER SHOT");

  if (table.ball_in_hand) {
    this.set_ball_in_hand_position(legal_balls);
    table.ball_in_hand = 0;
  }

  var shot_candidates = this.get_shot_condidates(legal_balls, table.cue_ball);

  var shot_vectors = [];
  for (var i = 0; i < shot_candidates.length; i++) {
    shot_vectors.push(shot_candidates[i].shot_vector());
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
  console.log(shot_candidates[index]);

  delay += 500;
  setTimeout(function() {
    table.adjust_shot(shot_vector.clone());
    table.shot_candidate = shot_candidates[index];
  }, delay);
  delay += 1000;
  setTimeout(function() {
    table.commit_shot(shot_vector.clone());
    table.shot_candidate = null;
  }, delay);
}
