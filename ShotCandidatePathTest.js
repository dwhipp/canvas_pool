AddTestGroup('ShotCandidatePathTest', {

'straight line shot': function(test) {
  var r = 0.1;
  var cue_ball = new Ball(0, 0, r);
  var object_ball = new Ball(1, 0, r);
  var target = { 'aimpoint': new Vector(2, 0) };

  var path = ShotCandidatePath.direct(cue_ball, object_ball, target);
  var expect = new Vector(1 - 2*r, 0);
  test.assertDotEquals(expect, path.aimpoint);
},

'simple angle shot': function(test) {
  var sqrt2 = Math.sqrt(2);
  var r = 0.1;
  var cue_ball = new Ball(0, r*sqrt2, r);
  var object_ball = new Ball(1, 0, r);
  var target = { 'aimpoint': new Vector(2, -1) };

  var path = ShotCandidatePath.direct(cue_ball, object_ball, target);
  var expect = new Vector(1 - r*sqrt2, r*sqrt2);
  test.assertDotEquals(expect, path.aimpoint, r/1000);
},

'cushion shot': function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {-0.8, 0.2}, y = 0.0
  // cushion outer: x = {-0.6, 0.4}, y = 0.2
  var cushion = new Cushion(-0.5, 0.1, 1, Math.PI/2, sqrt2/10);

  var r = 0.001;
  var cue_ball = new Ball(-2, -2, r);
  var object_ball = new Ball(-1, -1, r);
  var target = { 'aimpoint': new Vector(1, -1) };

  var path = ShotCandidatePath.one_cushion(
      cue_ball, object_ball, target, cushion);
  var expect = new Vector(-1 - r*sqrt2, -1 - r*sqrt2);
  test.assertDotEquals(expect, path.aimpoint, r/100);
},

'multiple paths': function(test) {
  var check = function(x,y,a) {
    var p0 = new Vector(0, 0);
    var p1 = new Vector(1, 0);
    var p2 = new Vector(x, y);
    var segments1 = [ new Line(p0, p1) ];
    var segments2 = [ new Line(p1, p2) ];
    var path2 = new ShotCandidatePath(segments2, null, p2);
    var path1 = new ShotCandidatePath(segments1, null, path2);
    path1.characterize();
    test.assertEquals(a, path1.angle_factor);
  }

  check(2, 1, 0.5);
  check(2, -1, 0.5);
  check(0, 1, 1.5);
  check(0, -1, 1.5);
}

});
