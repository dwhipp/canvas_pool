function FakeTable() {
  var returnFalse = function() { return false; }
  this.collision_would_pot_cueball = returnFalse;
  this.path_blocked = returnFalse;
}

AddTestGroup('ShotCandidateTest', {

'simple angle shot': function(test) {
  var sqrt2 = Math.sqrt(2);
  var r = 0.1;
  var cue_ball = new Ball(0, r*sqrt2, r);
  var object_ball = new Ball(1, 0, r);
  var aimpoint = new Vector(2, -1);
  var table = new FakeTable;

  var shot = ShotCandidate.pocketless_shot(
      table, cue_ball, aimpoint, object_ball);

  test.assertFalse(shot.impossible);

  var expect = new Vector(1 - r*sqrt2, r*sqrt2);
  test.assertDotEquals(expect, shot.aimpoint, r/1000);
},

});
