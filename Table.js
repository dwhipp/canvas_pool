// A table is where the action occurs


function Table () {
    this.update_id = null;
    this.shot = null;
};


Table.prototype.initialize = function ( game ) {
  this.balls = new Array();
  this.pockets = new Array();
  this.cushions = new Array();

  this.pockets.push(new Pocket( -1, -.5, ball_scale*pocket_scale ));
  this.pockets.push(new Pocket( -1,  .5, ball_scale*pocket_scale ));
  this.pockets.push(new Pocket(  0, -.5, ball_scale*pocket_scale ));
  this.pockets.push(new Pocket(  0,  .5, ball_scale*pocket_scale ));
  this.pockets.push(new Pocket(  1, -.5, ball_scale*pocket_scale ));
  this.pockets.push(new Pocket(  1,  .5, ball_scale*pocket_scale ));

  this.cushions.push( new Cushion( -1, 0.5, 1, Math.PI/2, ball_scale*pocket_scale ) );
  this.cushions.push( new Cushion( 0, 0.5, 1, Math.PI/2, ball_scale*pocket_scale ) );
  this.cushions.push( new Cushion( 0, -0.5, 1, -Math.PI/2, ball_scale*pocket_scale ) );
  this.cushions.push( new Cushion( 1, -0.5, 1, -Math.PI/2, ball_scale*pocket_scale ) );
  this.cushions.push( new Cushion( 1, 0.5, 1, Math.PI, ball_scale*pocket_scale ) );
  this.cushions.push( new Cushion( -1, -0.5, 1, 0, ball_scale*pocket_scale ) );

  // cue ball
  this.cue_ball = new Ball( .5, 0, ball_scale, white, "cue" );
  this.balls.push( this.cue_ball );
  this.ball_in_hand = 1;
  this.is_break_shot = false;

  status_message( "game", game );

  if (game == "9 Ball") {
    this.game = new Game_9ball( this );
    this.is_break_shot = true;
  }
  else if (game == "8 Ball") {
    this.game = new Game_8ball( this );
    this.is_break_shot = true;
  }
  else if (game == "2 Ball") {
    this.game = new Game_2ball( this );
  }
  else if (game == "1 Ball") {
    this.game = new Game_1ball( this );
  }
  else if (game == "0 Ball") {
    this.game = new Game_0ball( this );
  }
  else {
    alert( "unknown game: " + game );
  }

  this.game.create_balls( ball_scale );
  this.game.force_position_for_testing();
}

Table.prototype.legal_ball_in_hand_bounding_box = function() {
  if (this.is_break_shot) {
    return { 'left': 0.5 - this.cue_ball.radius, 'right': +1, 'top': -.5, 'bottom' : +.5 };
  } else {
    return { 'left': -1, 'right': +1, 'top': -.5, 'bottom' : +.5 };
  }
}

Table.prototype.player = function() {
  return this.game.player();
}

Table.prototype.get_ball_by_name = function(name, count) {
  if (!count) count = 1;
  for (var i = 0; i < this.balls.length; i++) {
    if (this.balls[i].name == name) {
      if (--count == 0) {
        return this.balls[i];
      }
    }
  }
  return null;
}

Table.prototype.get_pocket_by_position = function(x, y, distance) {
  var point = new Vector(x, y);
  for (var i = 0; i < this.pockets.length; i++) {
    var pocket = this.pockets[i];
    if (point.distance_from(pocket.position) < (distance ? distance : pocket.radius)) {
      return pocket;
    }
  }
  return null;
}

Table.prototype.replace_ball = function ( ball ) {

    ball.stop();
    var x = -0.5;
    var direction = -1;
    var done = 0;
    count = 50;

    while (!done) {
        if (--count == 0) done = 1;
        if (direction == -1 && x < -1+ball.radius) {
            x = -0.5;
            direction = 1;
        }
        else if (direction == 1 && x > 1-ball.radius) {
            x = -0.5;
            // give up
            done = 1;
        }
        else {
            ball.position = new Vector( x, 0 );
            var other = ball.find_overlapping_ball( this.balls );
            if (other != null) {
                var Dy = other.position.y;
                var h = ball.radius + other.radius;
                var Dx = Math.sqrt( h*h - Dy*Dy ) + rack_ball_spacing;
                x = other.position.x + Dx * direction;
            }
            else {
                done = 1;
            }
        }
    }

    ball.position = new Vector( x, 0 );
    this.balls.push(ball);
}

Table.prototype.begin_shot = function ( point ) {

    if (!this.is_stable()) return;

    var cue_ball = this.cue_ball;
    var D = point.difference( cue_ball.position );
    if ( D.squared() > cue_ball.radius*cue_ball.radius ) return;

    this.shot = new Shot( this.game, cue_ball, point );
}

Table.prototype.adjust_shot = function ( point ) {
    if (this.shot) {
        this.shot.adjust( point );
    }
}

Table.prototype.commit_shot = function ( point ) {
    if (this.shot) {
        this.shot.commit( point );
        this.shot = null;
        this.is_break_shot = false;
        this.do_action();
    }
}

Table.prototype.draw = function () {
    var ctx = this.ctx;

    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.rect( -1.5, -1, 3, 2 );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cyan;
    ctx.beginPath();
    ctx.rect( -1.2, -0.7, 2.4, 1.4 );
    ctx.closePath();
    ctx.fill();

    var outer = ball_scale * pocket_scale * Math.SQRT2;
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.rect( -1-outer, -0.5-outer, 2+2*outer, 1+2*outer );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = black;
    ctx.lineWidth = 0.005;
    ctx.beginPath();
    ctx.moveTo( 0.5, 0.5 );
    ctx.lineTo( 0.5, -0.5 );
    ctx.moveTo( 0.5, 0.25 );
    ctx.arc( 0.5, 0, 0.25, Math.PI*0.5, Math.PI*-0.5, true );
    ctx.closePath();
    ctx.stroke();

    for (pocket in this.pockets) {
        this.pockets[pocket].draw( ctx );
    }

    for (cushion in this.cushions) {
        this.cushions[cushion].draw( ctx );
    }

    var inner = outer / 2;
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.moveTo( -1-inner, -0.5-inner );
    ctx.lineTo( -1-inner, +0.5+inner );
    ctx.lineTo( +1+inner, +0.5+inner );
    ctx.lineTo( +1+inner, -0.5-inner );
    ctx.moveTo( +1+outer, -0.5-outer );
    ctx.lineTo( +1+outer, +0.5+outer );
    ctx.lineTo( -1-outer, +0.5+outer );
    ctx.lineTo( -1-outer, -0.5-outer );
    ctx.lineTo( +1+outer, -0.5-outer );
    ctx.moveTo( +1+inner, -0.5-inner );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    for (ball in this.balls) {
        this.balls[ball].draw( ctx );
    }

    if (this.shot) {
        this.shot.draw( ctx );
    }

    if (DEBUG && this.shot_candidate) {
      this.shot_candidate.draw( ctx );
    }
}

Table.prototype.update = function () {
    for (i in this.balls) {
        this.balls[i].begin_update();
    }

    for (i in this.balls) {
        var ball_i = this.balls[i];
        for (j in this.balls) {
            if (i != j) {
                var ball_j = this.balls[j];
                if (ball_i.do_collision( ball_j )) {
                    this.game.collision( ball_i, ball_j );
                }
            }
        }
    }

    for (var i = 0; i < this.balls.length; i++) {
        var ball = this.balls[i];
        var cushion = ball.do_cushion( this );
        if (cushion) {
            this.game.cushion( ball, cushion  );
        }
    }

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].do_friction();
    }

    var potted = new Array();
    for (var i = 0; i < this.balls.length; i++) {
        if (this.balls[i].is_potted( this.pockets )) {
            this.balls[i].stop();
            potted.push(i);
        }
    }
    while (potted.length) {
        var i = potted.shift();
        this.game.potted(this.balls[i]);
        this.balls[i] = this.balls[0];
        this.balls.shift();
    }

    var off_table = new Array();
    for (var i = 0; i < this.balls.length; i++) {
      if (!this.balls[i].end_update(this)) {
        this.balls[i].stop();
        off_table.push(i);
      }
    }
    while (off_table.length) {
      var i = off_table.shift();
      this.game.off_table_balls.push(this.balls[i]);
      this.balls[i] = this.balls[0];
      this.balls.shift();
    }
}

Table.prototype.is_stable = function () {
  for (i in this.balls) {
    if (!this.balls[i].is_stable()) return false;
  }
  return true;
}

Table.prototype.do_action = function () {

    var table = this;

    function update_fn() {
        table.update();
    }

    if (table.update_id == null) {
        table.update_id = setInterval( update_fn, 10 );
    }

}

Table.prototype.path_blocked = function(ball_at_start, start_position, target, ball_at_target) {
  var balls = this.balls;
  var path = new Line(start_position, target);
  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if (ball != ball_at_start && ball != ball_at_target &&
        ball.blocks_path(path)) {
      return true;
    }
  }
  return false;
}

Table.prototype.collision_would_pot_cueball = function(shot_candidate) {
  var cueball = shot_candidate.cueball;
  var aimpoint = shot_candidate.aimpoint;
  var object_ball = shot_candidate.object_ball;
  var final_destination = shot_candidate.final_destination;

  if (this.path_blocked(object_ball, aimpoint, final_destination, cueball)) {
    return false;
  }

  var pockets = this.pockets;
  for (var i = 0; i < pockets.length; i++) {
    if (pockets[i].shot_would_pot_cueball(shot_candidate)) {
      return true;
    }
  }
  return false;
}

Table.prototype.random_position = function(ball) {
  return new Vector(Math.random() * 2 * (1 - ball.radius) - 1,
                    Math.random() * (1 - ball.radius) - 0.5);
}

