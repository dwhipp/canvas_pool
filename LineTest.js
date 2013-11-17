AddTestGroup('LineTest', {

'equals' : function(test) {
  var p1 = new Vector(3, 4);
  var p2 = new Vector(1, 3);
  var p3 = new Vector(2, 5);

  // equal.
  var l1 = new Line(p1, p2);
  var l2 = new Line(p1.clone(), p2.clone());
  test.assertDotEquals(l1, l2);

  // 'start' new equal.
  var l3 = new Line(p1, p3);
  test.assertFalse(l1.equals(l3));

  // 'end' new equal.
  var l4 = new Line(p3, p2);
  test.assertFalse(l1.equals(l4));
},

'move' : function(test) {
  var start = new Vector(1, -1);
  var end = new Vector(3, 2);
  var move = new Vector(5, 3);
  var new_start = new Vector(6, 2);
  var new_end = new Vector(8, 5);
  var line = new Line(start, end);
  var expect = new Line(new_start, new_end);
  line.move(move);
  test.assertDotEquals(expect, line);
},

'intersect' : function(test) {
  var l1 = new Line(new Vector(0, 0), new Vector(4, 4));
  var l2 = new Line(new Vector(0, 4), new Vector(4, 0));
  var expect = new Vector(2, 2);
  test.assertDotEquals(expect, l1.intersect(l2));
},

});
