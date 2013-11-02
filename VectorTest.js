AddTestGroup('VectorTest', {

'Equality': function(test) {
    var v1 = new Vector(3, 4);
    var v2 = new Vector(3, 4);
    var v3 = new Vector(5, 6);
    test.assertDotEquals(v1, v2);
    test.assertFalse(v1.equals(v3));
},

'Dot Product': function(test) {
  var v1 = new Vector(2, 3);
  var v2 = new Vector(5, 7);
  test.assertEquals(31, v1.dot_product(v2));
},

'Squared': function(test) {
  var v1 = new Vector(3, 4);
  test.assertEquals(25, v1.squared());
},

'Magnitude': function(test) {
  var v1 = new Vector(3, 4);
  test.assertEquals(5, v1.magnitude());
},

'Angle': function(test) {
  var v1 = new Vector(1, 0);
  var v2 = new Vector(0, 1);
  var v3 = new Vector(-1, 0);
  var v4 = new Vector(0, -1);
  var v5 = new Vector(1, 1);
  test.assertEquals(0.5 * Math.PI, v1.angle());
  test.assertEquals(0.0 * Math.PI, v2.angle());
  test.assertEquals(-.5 * Math.PI, v3.angle());
  test.assertEquals(1.0 * Math.PI, v4.angle());
  test.assertEquals(.25 * Math.PI, v5.angle());
},

'Scale' : function(test) {
  var v1 = new Vector(6, 8);
  var v2 = new Vector(3, 4);
  v2.scale(2);
  test.assertDotEquals(v1, v2);
},

'Add' : function(test) {
  var v1 = new Vector(1, 3);
  var v2 = new Vector(5, 6);
  var v3 = new Vector(6, 9);
  test.assertDotEquals(v3, v1.add(v2));
},

'Add Scaled' : function(test) {
  var v1 = new Vector(1, 3);
  var v2 = new Vector(5, 6);
  var v3 = new Vector(11, 15);
  test.assertDotEquals(v3, v1.add_scaled(v2, 2));
},

'Subtract (and difference)' : function(test) {
  var v1 = new Vector(6, 9);
  var v2 = new Vector(5, 6);
  var v3 = new Vector(1, 3);
  var v4 = new Vector(-4, -3);
  test.assertDotEquals(v3, v1.difference(v2));
  test.assertDotEquals(v3, v1.subtract(v2));
  test.assertDotEquals(v4, v1.subtract(v2));
},

'Scale Down' : function(test) {
  var v1 = new Vector(6, 8);
  var v2 = new Vector(3, 4);
  v1.scale_down(2);
  test.assertDotEquals(v1, v2);
},

'unit vector' : function(test) {
  var v1 = new Vector(1, 1);
  var v2 = v1.unit();
  test.assertApproxEquals(1, v2.magnitude(), 1e-6);
  test.assertApproxEquals(0.25 * Math.PI, v2.angle(), 1e-6);
},

'normal vector' : function(test) {
  var v1 = new Vector(3, 4);
  var v2 = v1.normal();
  var v3 = new Vector(-4, 3);
  test.assertDotEquals(v3, v2);
},

'distance' : function(test) {
  var v1 = new Vector(1, 4);
  var v2 = new Vector(4, 8);
  test.assertEquals(5, v1.distance_from(v2));
},

});
