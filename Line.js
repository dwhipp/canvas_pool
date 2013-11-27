// A line joins two points.

function Line(a,b) {
  this.start = a.clone();
  this.end = b.clone();
}

Line.prototype.equals = function(other, epsilon) {
  return this.start.equals(other.start, epsilon)
      && this.end.equals(other.end, epsilon);
}

Line.prototype.length = function() {
  return this.start.distance_from(this.end);
}

Line.prototype.move = function(vec) {
  this.start.add(vec);
  this.end.add(vec);
}

Line.prototype.intersect = function(other, epsilon) {
  var x1 = this.start.x;
  var y1 = this.start.y;
  var x2 = this.end.x;
  var y2 = this.end.y;
  var x3 = other.start.x;
  var y3 = other.start.y;
  var x4 = other.end.x;
  var y4 = other.end.y;

  var px = (x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4);
  var py = (x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4);
  var scale = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
  px /= scale;
  py /= scale;

  if (!epsilon) {
    epsilon = 0;
  }
  var value_in_range = function(min, v, max) {
    if (v - min < -epsilon) {
      return false;
    }
    if (max - v < -epsilon) {
      return false;
    }
    return true;
    //return v >= min && v <= max;
  };

  if (!value_in_range(
      Math.max(Math.min(x1, x2), Math.min(x3, x4)),
      px,
      Math.min(Math.max(x1, x2), Math.max(x3, x4)))) {
    return null;
  }

  if (!value_in_range(
      Math.max(Math.min(y1, y2), Math.min(y3, y4)),
      py,
      Math.min(Math.max(y1, y2), Math.max(y3, y4)))) {
    return null;
  }

  return new Vector(px, py);
}
