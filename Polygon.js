// Generic polygon is a collection of points (which can be drawn to a context)

function Polygon (start) {
    this.points = new Array();
    this.points.push(start);
}

Polygon.prototype.center = function() {
  var center = new Vector(0, 0);
  for (var i = 0; i < this.points.length; i++) {
    center.add(this.points[i]);
  }
  center.scale_down(this.points.length);
  return center;
}

Polygon.prototype.move = function( length, angle ) {
    var vec = polar_vector( length, angle );
    return this.points[ this.points.length - 1].add(vec);
};

Polygon.prototype.line = function( length, angle ) {
    var p = this.points.pop();
    this.points.push(p);
    this.points.push(p.clone());
    return this.move( length, angle );
};

Polygon.prototype.draw = function (ctx) {
    var points = this.points;
    var i = 0;
    var p = points[0];
    ctx.beginPath();
    ctx.moveTo( p.x, p.y );
    for (i=1; i<points.length; ++i) {
        p = points[i];
        ctx.lineTo( p.x, p.y );
    }
    ctx.closePath();
}

Polygon.prototype.intersects = function(line, radius) {
  var points = this.points;
  var p = points[0];
  for (i=1; i<points.length; ++i) {
    var segment = new Line(p, points[i]);
    if (line.intersect(segment)) {
      return true;
    }
    p = points[i];
  }
  if (radius) {
    for (i=0; i < points.length; ++i) {
      var d = points[i].distance_from_line(line);
      if (d > 0 && d < radius) {
        return true;
      }
    }
  }
  return false;
}
