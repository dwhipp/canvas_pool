function MockContext(test, path) {
  this.test = test;
  this.opened = false;
  this.closed = false;
  this.index = 0;
  this.path = path;
}

MockContext.prototype.beginPath = function() {
  this.test.assertFalse(this.opened);
  this.test.assertFalse(this.closed);
  this.opened = true;
}

MockContext.prototype.closePath = function() {
  this.test.assertTrue(this.opened);
  this.test.assertFalse(this.closed);
  this.closed = true;
  this.test.assertEquals(this.path.length, this.index);
}

MockContext.prototype.moveTo = function(x, y) {
  this.test.assertTrue(this.opened);
  this.test.assertFalse(this.closed);
  this.test.assertEquals(0, this.index);
  this.test.assertDotEquals(this.path[this.index], new Vector(x, y));
  this.index++;
}

MockContext.prototype.lineTo = function(x, y) {
  this.test.assertTrue(this.opened);
  this.test.assertFalse(this.closed);
  this.test.assertFalse(0 == this.index);
  this.test.assertDotEquals(this.path[this.index], new Vector(x, y));
  this.index++;
}

MockContext.prototype.done = function() {
  this.test.assertTrue(this.closed);
}

AddTestGroup('PolygonTest', {

'Simple Shape from origin': function(test) {
  var p = new Polygon(new Vector(0,0));
  p.line(1, 0);
  p.line(1, 0.5 * Math.PI);

  var cxt = new MockContext(test, [
    new Vector(0, 0),
    new Vector(0, 1),
    new Vector(1, 1),
  ]);
  p.draw(cxt);
  cxt.done();
},

'Simple Shape moved': function(test) {
  var p = new Polygon(new Vector(0,0));
  p.move(1, 0);
  p.line(1, 0.5 * Math.PI);

  var cxt = new MockContext(test, [
    new Vector(0, 1),
    new Vector(1, 1),
  ]);
  p.draw(cxt);
  cxt.done();
}

});
