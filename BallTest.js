AddTestGroup('BallTest', {

'blocks path test (positive height)': function(test) {
  var block0 = new Ball(5, 0, 1);
  var block1 = new Ball(5, 1, 1);
  var block2 = new Ball(5, 3, 1);

  var origin = new Vector(0, 0);
  var aim = new Vector(10, 0);

  test.assertTrue(block0.blocks_path(origin, aim));
  test.assertTrue(block1.blocks_path(origin, aim));
  test.assertFalse(block2.blocks_path(origin, aim));
},

'blocks path test (negative height)': function(test) {
  var block0 = new Ball(5, -0, 1);
  var block1 = new Ball(5, -1, 1);
  var block2 = new Ball(5, -3, 1);

  var origin = new Vector(0, 0);
  var aim = new Vector(10, 0);

  test.assertTrue(block0.blocks_path(origin, aim));
  test.assertTrue(block1.blocks_path(origin, aim));
  test.assertFalse(block2.blocks_path(origin, aim));
},

'blocks path test (negative x)': function(test) {
  var block0 = new Ball(5, 0, 1);
  var block1 = new Ball(5, 1, 1);
  var block2 = new Ball(5, 3, 1);

  var origin = new Vector(10, 0);
  var aim = new Vector(0, 0);

  test.assertTrue(block0.blocks_path(origin, aim));
  test.assertTrue(block1.blocks_path(origin, aim));
  test.assertFalse(block2.blocks_path(origin, aim));
},


});
