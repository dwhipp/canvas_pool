// The "Ball" class represents a pool ball, and its position and motion on the table

function Ball( x, y, radius, color, name ) {
  this.position = new Vector(x,y);
  this.velocity = new Vector(0,0);
  this.spin = new Vector(0,0);
  this.side = 0;
  this.acceleration = new Vector(0,0);
  this.radius = radius;
  this.color = color;
  this.name = name;
}

Ball.prototype.stop = function () {
  this.velocity.zero();
  this.spin.zero();
  this.acceleration.zero();
}

Ball.prototype.is_stable = function () {
  return this.velocity.is_null() && this.spin.is_null();
}

Ball.prototype.set_position = function (base, offset_x, offset_y) {
  this.position = new Vector(offset_x, offset_y).scale(this.radius).add(base);
}

Ball.prototype.draw = function (ctx) {
  ctx.save();
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI*2, true );
  ctx.closePath();
  ctx.fill();

  if (this.color == gold) {
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc( this.position.x, this.position.y, this.radius/2.5, 0, Math.PI*2, true );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

Ball.prototype.impulse = function ( velocity, spin, side ) {
  this.velocity = velocity;
  this.spin = spin;
  this.side = side;
}

Ball.prototype.speed = function () {
  return this.velocity.magnitude();
}

Ball.prototype.ground_velocity = function () {
  return this.velocity.difference(this.spin);
}

Ball.prototype.angle = function() {
  return this.velocity.angle();
}

Ball.prototype.begin_update = function () {
  this.prev_cushion = this.this_cushion;
  this.this_cushion = null;
  this.position.add_scaled( this.velocity, ball_scale );
  this.acceleration.zero();
}

Ball.prototype.end_update = function ( table ) {
  if (this.position.x - this.radius < -1
      || this.position.x + this.radius > 1
      || this.position.y - this.radius < -.5
      || this.position.y + this.radius > .5
     ) {
    this.stop();
    return false;
  }
  else
  {
    this.velocity.add( this.acceleration );
    var clamp = 0.8;
    if (this.velocity.magnitude() > clamp) {
      this.velocity = this.velocity.unit().scale(clamp);
    }
    return true;
  }
}

Ball.prototype.resolve_cushion_impact = function ( impact ) {
  var speed = impact.dot_product( this.velocity );
  if (speed > 0) {
    this.velocity.add_scaled( impact, -2*speed );
    this.acceleration.add_scaled( impact.normal(), this.side );
  } else {
    this.velocity.add_scaled( impact, 4*speed );
    this.acceleration.add_scaled( impact.normal(), -this.side );
  }

  // reduce energy
  this.velocity.scale(0.9);
  this.side /= 2;
  this.spin.scale_down( 2 );

}

Ball.prototype.do_cushion = function ( table ) {

  if (this.velocity.is_null()) return null;

  for (i in table.cushions) {
    var cushion = table.cushions[i];
    var impact = cushion.ball_impact_vector(this);
    if (impact) {
      if (cushion != this.prev_cushion) {
        this.resolve_cushion_impact(impact);
      }
      this.this_cushion = cushion;
      return cushion;
    }
  }

  return null;
}

Ball.prototype.do_friction = function () {
  var velocity = this.ground_velocity();

  var swerve = this.spin.normal().scale( this.side );
  if (swerve.magnitude() > rolling_threshold) {
    velocity.add_scaled(swerve, 50);
    this.side -= rolling_friction * (this.side > 0 ? 1 : -1);
  }

  var speed = velocity.magnitude();
  var acc;

  if (speed > rolling_threshold) {
    acc = skimming_friction;
  }
  else if (speed > static_threshold) {
    acc = rolling_friction;
    this.spin.zero();
    this.side -= skimming_friction * (this.side > 0 ? 1 : -1);
  }
  else {
    if (this.velocity.magnitude() < static_threshold) this.velocity.zero();
    if (this.spin.magnitude() < static_threshold) this.spin.zero();
    acc = 0;
  }

  if (acc != 0) {
    this.acceleration.add_scaled( velocity.unit(), -acc );
    this.spin.add_scaled( velocity.unit(), acc );
  }
}

Ball.prototype.do_collision = function ( other ) {

  if (this.velocity.is_null()) return false;

  var separation = this.position.difference( other.position );
  var distance = separation.magnitude();
  if (distance > this.radius * 2) return false;

  // Increase accuracy of collision by interpolating the position of the
  // collision back through the velocity.
  var correction = -1;
  for (var i = 0; i < 20; i++) {
    var corrected = separation.clone().add_scaled(this.velocity, correction);
    distance = corrected.magnitude();
    if (distance < this.radius * 2) {
      separation = corrected;
    }
    correction /= 2;
  }

  var collision_unit = separation.unit();
  var collision_speed = collision_unit.dot_product( this.velocity );

  if (collision_speed < 0) {
    this.acceleration.add_scaled( collision_unit, -collision_speed );
    other.acceleration.add_scaled( collision_unit, collision_speed );
  }

  return true;
}

Ball.prototype.is_potted = function (pockets, position) {
  if ( ! position ) {
    position = this.position;
  }
  for (p in pockets) {
    var sep = position.distance_from( pockets[p].position );
    if (sep < this.radius/2 + pockets[p].radius) return true;
  }
  return false;
}

Ball.prototype.find_overlapping_ball = function ( balls ) {
  for (i in balls) {
    var other = balls[i];
    if (this != other ) {
      var sep = this.position.distance_from( other.position );
      if (sep <= this.radius + other.radius) return other;
    }
  }
  return null;
}

Ball.prototype.is_legal_ball_in_hand_position = function ( table, position ) {
  if ( ! position ) {
    position = this.position;
  }

  var bbox = table.legal_ball_in_hand_bounding_box();

  if ( position.x - this.radius < bbox.left) return false;
  if ( position.x + this.radius > bbox.right) return false;
  if ( position.y - this.radius < bbox.top) return false;
  if ( position.y + this.radius > bbox.bottom) return false;

  if ( this.find_overlapping_ball( table.balls ) ) return false;

  for (i in table.cushions) {
    var impact = table.cushions[i].ball_impact_vector(this, position);
    if (impact) return false;
  }

  if (this.is_potted( table.pockets, position )) return false;

  return true;
}

Ball.prototype.blocks_path = function(line) {
  var distance = this.position.distance_from_line(line);
  return distance != null && distance < this.radius * 2;
}

