AddTestGroup('BallTest', {

'blocks path test (positive height)': function(test) {
  var block0 = new Ball(5, 0, 1);
  var block1 = new Ball(5, 1, 1);
  var block2 = new Ball(5, 3, 1);

  var path = new Line(new Vector(0, 0), new Vector(10, 0));

  test.assertTrue(block0.blocks_path(path));
  test.assertTrue(block1.blocks_path(path));
  test.assertFalse(block2.blocks_path(path));
},

'blocks path test (negative height)': function(test) {
  var block0 = new Ball(5, -0, 1);
  var block1 = new Ball(5, -1, 1);
  var block2 = new Ball(5, -3, 1);

  var path = new Line(new Vector(0, 0), new Vector(10, 0));

  test.assertTrue(block0.blocks_path(path));
  test.assertTrue(block1.blocks_path(path));
  test.assertFalse(block2.blocks_path(path));
},

'blocks path test (negative x)': function(test) {
  var block0 = new Ball(5, 0, 1);
  var block1 = new Ball(5, 1, 1);
  var block2 = new Ball(5, 3, 1);

  var path = new Line(new Vector(10, 0), new Vector(0, 0));

  test.assertTrue(block0.blocks_path(path));
  test.assertTrue(block1.blocks_path(path));
  test.assertFalse(block2.blocks_path(path));
},

"ball to side doesn't block": function(test) {
  var block = new Ball(-1, 0, 1);
  var path = new Line(new Vector(0, 0), new Vector(0, 2));
  test.assertFalse(block.blocks_path(path));
}


});
