// the main interaction with the web page

var white = "#ffffff";
var red = "#ff0000";
var yellow = "#ffff00";
var green = "#00ff00";
var black = "#000000";
var gray = "#808080";

var blue = "#0000ff";
var cyan = "#00ffff";

var purple = "#ff00ff";
var gold = "#ffff80";
var orange = "#ffa000";
var darkgreen = "#008000";
var brown = "#808040";

var show_targetting_line = 1;
var game = "9 Ball";

var table_scale = 0.7
var ball_scale = table_scale/20;
var pocket_scale = 1.5;
var rack_ball_spacing = 0.01;

var skimming_friction = 1/400;
var rolling_threshold = skimming_friction * 30;
var rolling_friction = skimming_friction / 20;
var static_threshold = rolling_friction * 10;

var strength_scaling = 2.5;
var masse_scaling = 1;

var classes = new Array(
        "Ball",
        "Cushion",
        "Game",
        "Player",
        "Pocket",
        "Polygon",
        "Shot",
        "ShotCandidate",
        "Table",
        "Vector"
);

var i;
for (i=0; i<classes.length; ++i) {
  document.write( "<script type='text/javascript' src='" + classes[i] + ".js'></script>" );
}

function status_message( prefix, msg) {
    var elem = document.getElementById("msg");
    var txt = prefix;
    if (msg != null) {
        txt += ": " + msg;
    }
    elem.innerHTML = txt;
}

function append_status_message( prefix, msg) {
    var elem = document.getElementById("msg");
    elem.innerHTML += "<br>" + prefix + ": " + msg;
}


var draw_id = null;

function GetXmlHttpObject() {
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        return new XMLHttpRequest();
    }
    if (window.ActiveXObject) {
        // code for IE6, IE5
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
    return null;
}

var current_game;
function set_player_type(form, index) {
  if (!current_game) return;
  var type_rb = document.getElementsByName(form);
  for (var i = 0; i < type_rb.length; ++i) {
    if (type_rb[i].checked) {
      current_game.set_player_type(type_rb[i].value, index);
    }
  }
}


function init_pool_table(name) {

    if (draw_id) {
        clearInterval( draw_id );
        draw_id = null;
    }

    var game_rb = document.getElementsByName( name + "_game" );
    var i;
    for (i=0; i<game_rb.length; ++i) {
        if (game_rb[i].checked) game = game_rb[i].value;
    }

    var div = document.getElementById(name);

    if ( game == "Rules" ) {
        var xmlhttp = GetXmlHttpObject();
        if (xmlhttp==null) {
            div.innerHTML = "<b>ERROR</b>: Your browser doesn't seem to support AJAX";
            return;
        }

        var marker = "loading User Guide ...";
        var url = "canvas_pool_rules.html";

        div.innerHTML = marker;

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState==4) {
                var html = xmlhttp.responseText;
                if (div.innerHTML == marker) {
                    div.innerHTML = html;
                    status_message( "viewing", url );
                    window.onresize = null;
                }
            }
        }

        status_message( "loading", url );

        xmlhttp.open("GET",url,true);
        xmlhttp.send(null);
        return;
    }

    if ( game == "Source" ) {
        var code_div = document.createElement("div");
        var code = document.createElement("iframe");
        var txt = document.createTextNode("Oops, source code not visible");
        code.width = "100%";

        window.onresize = function() {
            var height = window.innerHeight - 350;
            if (height < 100) height = 100;
            code.height = height;
        }
        window.onresize.call();

        code.appendChild(txt);

        function view_class ( filename ) {
            return function () {
              var url = filename;
              status_message( "viewing", url );
              code.src = url;
            }
        }

        var form = document.createElement("form");

        var txt = document.createTextNode( "Source Classes: " );
        form.appendChild(txt);

        function add_file(name, filename) {
            var input = document.createElement("input");
            input.type = "radio";
            input.name = "class_view";
            input.value = filename;
            input.onclick = view_class( filename )
            form.appendChild(input);
            var txt = document.createTextNode( name );
            form.appendChild(txt);
        }

        function add_selection( name ) {
          add_file(name, name + ".js");
        }

        for (i in classes) {
          add_selection( classes[i] );
        }
        add_selection( "canvas_pool" );
        add_file('tests', 'tests.html');

        div.innerHTML = "";
        div.appendChild(form);
        div.appendChild(code);

        status_message( "select Class to view" );

        return;
    }

    var table;
    var canvas_name = name + "_canvas";

    function set_drawing_context() {
        var width = window.innerWidth - 16;
        if (width < 300) width = 300;
        var height = width / 2;

        var canvas_html = "<canvas";
        canvas_html += " id=" + canvas_name;
        canvas_html += " width=" + width;
        canvas_html += " height=" + height;
        canvas_html += ">Sorry, your browser doesn't appear to support the HTML-5 Canvas</canvas>";
        div.innerHTML = canvas_html;

        var canvas = document.getElementById(canvas_name);
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (!table) {
            table = new Table();
            table.initialize( game );
        }

        // table center is (0,0);
        // length is -1 .. +1;
        // width is -.5 .. +.5
        ctx.translate( width/2, height/2 );
        ctx.scale( height*table_scale, height*table_scale );

        table.ctx = ctx;

        var canvas_offset = new Vector(
                canvas.offsetLeft + width/2,
                canvas.offsetTop + height/2
                );

        function mouse_vec(evt) {
            var vec = new Vector( evt.clientX + window.scrollX, evt.clientY + window.scrollY );
            vec.subtract( canvas_offset );
            vec.scale_down( height * table_scale );
            return vec;
        }

        function mouse_down(evt) {
          table.player().mouse_down(mouse_vec(evt));
        }

        function mouse_up(evt) {
          table.player().mouse_up(mouse_vec(evt));
        }

        function mouse_move(evt) {
          table.player().mouse_move(mouse_vec(evt));
        }

        canvas.addEventListener( 'mousedown', mouse_down, false );
        canvas.addEventListener( 'mouseup', mouse_up, false );
        canvas.addEventListener( 'mousemove', mouse_move, false );
    }

    set_drawing_context();

    if (table) {
        window.onresize = set_drawing_context;

        function key_down_fn(evt) {
            if (evt.keyCode == 48) { // '0'
                for (i in table.balls) {
                    table.balls[i].stop();
                }
            }
            if (evt.keyCode == 57) { // '9'
                table.ball_in_hand = 1;
            }
            if (evt.keyCode >= 49 && evt.keyCode <= 55) { // 1..7
                strength_scaling = ((evt.keyCode - 48) / 4) * 2.5;
            }
            if (evt.keyCode == 56) { // '8'
                masse_scaling = 4;
            }
        }

        function key_up_fn(evt) {
            if (evt.keyCode >= 49 && evt.keyCode <= 55) { // 1..7
                strength_scaling = 2.5;
            }
            if (evt.keyCode == 56) { // '8'
                masse_scaling = 1;
            }
        }

        document.onkeydown = key_down_fn;
        document.onkeyup = key_up_fn;

        function draw_fn() {
            table.draw();
            if (current_game != table.game) {
              current_game = table.game;
              set_player_type("player1_type", 0);
              set_player_type("player2_type", 1);
            }
            if (table.is_stable() && table.update_id != null) {
                clearInterval( table.update_id );
                table.update_id = null;
                table.game.shot_complete();
                table.player().begin_shot();
            }
        }

        if (draw_id == null) {
          draw_id = setInterval( draw_fn, 50 );
        }
    }
}
