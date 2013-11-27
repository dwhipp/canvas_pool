AddTestGroup('CushionTest', {

'impacts_main_line_of_cushion' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;
  for (var x = 0.3; x <= 0.7; x += 0.1) {
    var ball = new Ball(x, 0.4 - d, d * 1.0001);

    var impact = cushion.ball_impact_vector(ball);
    var expect = new Vector(0, 1);

    test.assertDotEquals(expect, impact, 1e-6);
  }
},

'impacts_first_pocket_edge' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;
  for (var x = 0; x <= 0.2; x += 0.1) {
    var ball = new Ball(0.1 + x - d, 0.6 - x - d, d * sqrt2 * 1.0001);

    var impact = cushion.ball_impact_vector(ball);
    var expect = new Vector(1/sqrt2, 1/sqrt2);

    test.assertDotEquals(expect, impact, 1e-6);
  }
},

'impacts_second_pocket_edge' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;
  for (var x = 0.0; x <= 0.2; x += 0.1) {
    var ball = new Ball(0.9 - x + d, 0.6 - x - d, d * sqrt2 * 1.0001);

    var impact = cushion.ball_impact_vector(ball);
    var expect = new Vector(-1/sqrt2, 1/sqrt2);

    test.assertDotEquals(expect, impact, 1e-6);
  }
},

'impacts_first_point_of_cushion' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;

  for (var angle = 0; angle <= 45; angle += 5) {
    var p = polar_vector(d, -angle/180 * Math.PI);
    var ball = new Ball(0.3 + p.x, 0.4 + p.y, d * 1.0001);
    var impact = cushion.ball_impact_vector(ball);
    var expect = p.scale(-1).unit();
    test.assertDotEquals(expect, impact, 1e-6);
  }
},

'impacts_second_point_of_cushion' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;

  for (var angle = 0; angle <= 45; angle += 5) {
    var p = polar_vector(d, angle/180 * Math.PI);
    var ball = new Ball(0.7 + p.x, 0.4 + p.y, d * 1.0001);
    var impact = cushion.ball_impact_vector(ball);
    var expect = p.scale(-1).unit();
    test.assertDotEquals(expect, impact, 1e-6);
  }
},

'cushion_expels_ball' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;
  for (var x = 0.2; x <= 0.8; x += 0.1) {
    var ball = new Ball(x, 0.5 - d, d * 1.0001);
    var impact = cushion.ball_impact_vector(ball);
    test.assertTrue(impact.y > 0);
  }
},

'cushion_acts_locally' : function(test) {
  var sqrt2 = Math.SQRT2;
  // cushion inner: x = {0.3, 0.7}, y = 0.4
  // cushion outer: x = {0.1, 0.9}, y = 0.6
  var cushion = new Cushion(0, 0.5, 1, Math.PI/2, sqrt2/10);
  var d = 0.001;
  for (var x = 0.2; x <= 0.7; x += 0.1) {
    var ball = new Ball(x, 0.3, d * 1.0001);
    test.assertFalse(cushion.ball_impact_vector(ball));
  }
},

});
