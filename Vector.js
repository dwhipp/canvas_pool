// Generic 2-dimensional vector, with various operations

function Vector( x, y ) {
    this.x = x;
    this.y = y;
}

function polar_vector( mag, angle ) {
    return new Vector( mag * Math.sin(angle), mag * Math.cos(angle));
}

Vector.prototype.toString = function () {
    return "[" + this.x + ", " + this.y + " : " + this.magnitude() + " | " + this.angle() + "]";
}

Vector.prototype.clone = function () {
    return new Vector( this.x, this.y );
}

Vector.prototype.equals = function (other) {
  return this.x == other.x && this.y == other.y;
}

Vector.prototype.dot_product = function ( other ) {
    return this.x*other.x + this.y*other.y;
}

Vector.prototype.squared = function () {
    return this.dot_product(this);
}

Vector.prototype.magnitude = function () {
    return Math.sqrt( this.squared() );
}

Vector.prototype.angle = function () {
    return Math.atan2(this.x, this.y);
}

Vector.prototype.is_null = function () {
    return this.x == 0 && this.y == 0;
}

Vector.prototype.zero = function () {
    this.x = 0;
    this.y = 0;
    return this;
}

Vector.prototype.add = function ( other ) {
    this.x += other.x;
    this.y += other.y;
    return this;
}

Vector.prototype.add_scaled = function ( other, scale ) {
    this.x += other.x * scale;
    this.y += other.y * scale;
    return this;
}

Vector.prototype.subtract = function ( other ) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
}

Vector.prototype.scale = function ( scale ) {
    this.x *= scale;
    this.y *= scale;
    return this;
}

Vector.prototype.scale_down = function ( scale ) {
    this.x /= scale;
    this.y /= scale;
    return this;
}

Vector.prototype.unit = function () {
    return this.clone().scale_down( this.magnitude() );
}

Vector.prototype.normal = function () {
    return new Vector( -this.y, this.x );
}
Vector.prototype.difference = function(other) {
    return this.clone().subtract( other );
}

Vector.prototype.distance_from = function(other) {
    return this.difference(other).magnitude();
}

Vector.prototype.reflect_off = function(other) {
  return other.clone()
    .scale(2 * this.dot_product(other) / other.squared())
    .subtract(this);
}

Vector.prototype.distance_from_line = function(start, end) {
  var from_start = this.difference(start);
  var from_end = this.difference(end);
  var start_to_end = end.difference(start);

  var distance_start_to_end = start_to_end.magnitude();
  var distance_from_start = from_start.magnitude();
  var distance_from_end = from_end.magnitude();

  if (distance_from_start > distance_start_to_end ||
      distance_from_end > distance_start_to_end) {
    return null;
  }

  var angle_from_this = from_start.angle();
  var angle_to_end = start_to_end.angle();
  var angle_from_start = angle_from_this - angle_to_end;
  return Math.abs(distance_from_start * Math.sin(angle_from_start));
}

