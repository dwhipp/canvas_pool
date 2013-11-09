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

ComputerPlayer.prototype.get_direct_shots = function(legal_balls, cueball) {
  var pockets = this.table.pockets;
  var candidates = [];
  for (var i = 0; i < legal_balls.length; i++) {
    var ball = legal_balls[i];
    for (var j = 0; j < pockets.length; j++) {
      var pocket = pockets[j];
      var candidate = ShotCandidate.direct_shot(this.table, cueball, ball, pocket);
      if (candidate.is_possible()) {
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

ComputerPlayer.prototype.get_cushion_shots = function(legal_balls, cueball) {
  var cushions = this.table.cushions;
  var candidates = [];
  for (var i = 0; i < cushions.length; i++) {
    for (var j = 0; j < legal_balls.length; j++) {
      var ball = legal_balls[j];
      var candidate = ShotCandidate.cueball_cushion_shot(
          this.table, cueball, cushions[i], ball.position, ball);
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
    var candidate = ShotCandidate.pocketless_shot(this.table, cueball, aimpoint, ball);
    if (candidate.is_possible()) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

ComputerPlayer.prototype.grep_candidates = function(candidates, match_fn) {
  var match = [];

  for (var i = 0; i < candidates.length; ++i)  {
    if (match_fn(candidates[i])) {
      match.push(candidates[i]);
    }
  }

  return match;
}

ComputerPlayer.prototype.get_shot_candidates = function(legal_balls, cueball, has_easy) {
  var candidates = this.get_direct_shots(legal_balls, cueball);

  candidates.sort(ShotCandidate.sort_by_difficulty);

  if (has_easy) {
    return candidates.length != 0 && candidates[0].is_easy();
  }

  if (candidates.length > 0) {
    var easy = this.grep_candidates(
        candidates, function(candidate) {return candidate.is_easy()});
    console.log("Candidates: ", easy.length, candidates);

    if (easy.length > 0) {
      return easy;
    }
    candidates = [ candidates[0] ];
    if (candidates[0].difficulty < 0.8) {
      return candidates;
    }
  }

  if (!this.table.is_break_shot) {
    var cushion_shots = this.get_cushion_shots(legal_balls, cueball);
    if (cushion_shots.length > 0) {
      candidates = candidates.concat(cushion_shots);
      candidates = candidates.concat(this.get_random_shots(
          legal_balls, cueball, legal_balls.length * cushion_shots.length));
    }
  }

  if (candidates.length > 0) {
    var easy = this.grep_candidates(
        candidates, function(candidate) {return candidate.difficulty < 1});
    if (easy.length > 0) {
      return easy;
    }
  }

  candidates = candidates.concat(this.get_random_shots(
      legal_balls, cueball, legal_balls.length * 20));

  if (candidates.length > 0) {
    var easy = this.grep_candidates(
        candidates, function(candidate) {return candidate.difficulty < 1});
    if (easy.length > 0) {
      return easy;
    }
    var hard = this.grep_candidates(
        candidates, function(candidate) {return candidate.difficulty < 10});
    if (hard.length > 0) {
      return hard;
    }
    return candidates;
  }

  var random_aimpoint = new Vector(Math.random() * 2 - 1, Math.random() - 0.5);
  console.log("RANDOM: ", random_aimpoint);
  return [ShotCandidate.random_shot(this.table, cueball, random_aimpoint)];
}

ComputerPlayer.prototype.set_ball_in_hand_position = function(legal_balls) {
  var table = this.table;
  var pockets = table.pockets;
  var cue_ball = table.cue_ball;
  var positions = [];
  for (var i = 0; i < legal_balls.length * 5; i++) {
    var ball = legal_balls[i % legal_balls.length];
    for (var j = 0; j < pockets.length; j++) {
      var position = pockets[j].get_ball_in_hand_candidate(cue_ball, ball);
      if (cue_ball.is_legal_ball_in_hand_position(table, position) ) {
        if (this.get_shot_candidates(legal_balls, cue_ball, true)) {
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

  var shot_candidates = this.get_shot_candidates(legal_balls, table.cue_ball);

  var delay = 700;
  setTimeout(function() { shot_candidates[0].begin_shot() }, delay);

  var shots_to_show = shot_candidates.length;
  if (shots_to_show > 5) {
    shots_to_show = 5;
  }

  function preview_shot(index) {
    delay += 500;
    setTimeout(function() { shot_candidates[index].begin_shot() }, delay);
  }

  for (var i = 1; i < shots_to_show; i++) {
    preview_shot(i % shot_candidates.length);
  }

  var index = Math.floor(Math.random() * shot_candidates.length);
  console.log(shot_candidates[index]);

  preview_shot(index);

  delay += 1000;
  setTimeout(function() { shot_candidates[index].commit_shot() }, delay);
}
