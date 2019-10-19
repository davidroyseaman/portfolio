import React from 'react';

const dothething = (canvasEl, outputEl) => {
  //3D attempts
  var O = (function() {
    var outputDiv = null;
    var setOutputDiv = function() {
      outputDiv = outputEl;
      outputDiv.firstChild.nodeValue = '';
    };

    var O = function(str) {
      outputDiv.firstChild.nodeValue += str;
    };

    var C = function() {
      outputDiv.firstChild.nodeValue = '';
    };

    return {
      O: O,
      S: setOutputDiv,
      C: C
    };
  }());

  var Profiler = (function() {
    var watches = {};
    var names = [];

    /**
     * @constructor
     */
    var Watch = function() {
      this.time = 0;
      this.updated = 0;
      this.s = null;
    };
    Watch.prototype.start = function() {
      this.s = Date.now();
    };
    Watch.prototype.stop = function() {
      this.time += Date.now() - this.s;
      this.updated++;
    };

    var addWatch = function(name) {
      watches[name] = new Watch();
      names.push(name);
    };

    var startWatch = function(name) {
      if (watches[name] === undefined) {
        addWatch(name);
      }
      watches[name].start();
    };

    var stopWatch = function(name) {
      watches[name].stop();
    };

    var getOutput = function() {
      var str = '';
      var totalTime = 0;
      var i = 0;
      for (i = 0; i < names.length; i++) {
        totalTime += watches[names[i]].time;
      }
      for (i = 0; i < names.length; i++) {
      /*str+= "[" +
           names[i] +":" +
           Math.floor(10000*watches[names[i]].time/totalTime)/100 +
           "]\n";*/
        str += '[' + names[i] + ': ' + Math.floor(10000 * watches[names[i]].time / totalTime) / 100 + '%, ' + Math.floor(
          1000 * 100 * watches[names[i]].time / watches[names[i]].updated) / 100 + 'ms]\n';
      }

      return str;

    };

    return {
      add: addWatch,
      start: startWatch,
      end: stopWatch,
      output: getOutput
    };

  }());

  var Matrix = (function() {
    var createNewArray = function(rows, cols) {
      var newArray = [];
      for (var i = 0; i < rows; i++) {
        newArray[i] = [];
        for (var j = 0; j < cols; j++) {
          newArray[i][j] = 0;
        }
      }
      return newArray;
    };

    /**
     * @constructor
     */
    var Matrix = function(rows, cols) {
      this._a = createNewArray(rows, cols);
      this.r = rows;
      this.c = cols;
    };
    Matrix.prototype.getSafe = function(inr, inc) {
      if (inr < 0) {
        throw ('Matrix row < 0');
      }
      if (inc < 0) {
        throw ('Matrix col < 0');
      }
      if (inr >= this.r) {
        throw ('Matrix row >= rows');
      }
      if (inc >= this.c) {
        throw ('Matrix col >= cols');
      }
      return this._a[inr][inc];
    };
    Matrix.prototype.get = function(inr, inc) {
      return this._a[inr][inc];
    };
    Matrix.prototype.setSafe = function(inr, inc, val) {
      if (inr < 0) {
        throw ('Matrix row < 0');
      }
      if (inc < 0) {
        throw ('Matrix col < 0');
      }
      if (inr >= this.r) {
        throw ('Matrix row >= rows');
      }
      if (inc >= this.c) {
        throw ('Matrix col >= cols');
      }
      this._a[inr][inc] = val;
    };
    Matrix.prototype.set = function(inr, inc, val) {
      this._a[inr][inc] = val;
    };
    //Set a matrix using an array
    Matrix.prototype.setA = function(a) {
      for (var r = 0; r < this.r; r++) {
        for (var c = 0; c < this.c; c++) {
          this._a[r][c] = a[r][c];
        }
      }
    };
    Matrix.prototype.toString = function() {
      var str = '';
      str += '[';
      for (var r = 0; r < this.r; r++) {
        if (r > 0) {
          str += '\n ';
        }
        for (var c = 0; c < this.c; c++) {
          if (c > 0) {
            str += ', ';
          }
          str += Math.floor(this._a[r][c] * 1000) / 1000;
        }
      }
      str += ']\n';
      return str;
    };


    var multiply = function(mat1, mat2) {
      //tests that i may remove
      //compatibility:
      /*if (mat1.c != mat2.r) {
        throw ("Matrix dimension mismatch");
      }*/

      var result = new Matrix(mat1.r, mat2.c);
      var val = 0; //the result of each mult
      //The actual calculation
      //each row in mat1
      for (var r = 0; r < mat1.r; r++) {
        //mult by each col in mat2
        for (var c = 0; c < mat2.c; c++) {
          //multiply each cell
          val = 0;
          for (var k = 0; k < mat1.c; k++) {
            val += mat1._a[r][k] * mat2._a[k][c];
          }
          //placed in r,c of output
          result._a[r][c]= val;
        }
      }
      return result;

    };

    return {
      Matrix: Matrix,
      mult: multiply
    };

  }());

  var _3d = (function() {

    /**
     * @constructor
     */
    var Point = function(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    };

    /**
     * @constructor
     */
    var Angle = function(tx, ty, tz) {
      this.tx = tx;
      this.ty = ty;
      this.tz = tz;
    };

    /**
     * @constructor
     */
    var Tri = function(pt1, pt2, pt3, style) {
      this.a = pt1;
      this.b = pt2;
      this.c = pt3;
      this.style = style;
    };


    //Locations for the transformation matrices
    var camLoc = new Point(0, 0, 0);
    var camRot = new Angle(0, 0, 0);
    var viewLoc = new Point(0, 0, 0);

    //'Cached' matrices so we don't keep doing the trig.
    var matx = new Matrix.Matrix(3, 3);
    var maty = new Matrix.Matrix(3, 3);
    var matz = new Matrix.Matrix(3, 3);
    var matt = new Matrix.Matrix(3, 3);

    var setProjection = function(cLoc, cRot, vLoc) {
      Profiler.start('EwTrig');
      //Cheats
      /*camLoc = new Point(cLoc[0], cLoc[1], cLoc[2]);
      camRot = new Angle(cRot[0], cRot[1], cRot[2]);
      viewLoc = new Point(vLoc[0], vLoc[1], vLoc[2]);*/
      camLoc.x = cLoc[0]; camLoc.y = cLoc[1]; camLoc.z = cLoc[2];
      camRot.tx = cRot[0]; camRot.ty = cRot[1]; camRot.tz = cRot[2];
      viewLoc.x = vLoc[0]; viewLoc.y = vLoc[1]; viewLoc.z = vLoc[2];
      /*O.O(camRot.tx);
      O.O(camRot.ty);
      O.O(camRot.tz);*/
      matx.setA([[1, 0, 0],
        [0, Math.cos(camRot.tx), -Math.sin(camRot.tx)],
        [0, Math.sin(camRot.tx), Math.cos(camRot.tx)]]);
      maty.setA([[Math.cos(camRot.ty), 0, Math.sin(camRot.ty)],
        [0, 1, 0],
        [-Math.sin(camRot.ty), 0, Math.cos(camRot.ty)]]);
      matz.setA([[Math.cos(camRot.tz), -Math.sin(camRot.tz), 0],
        [Math.sin(camRot.tz), Math.cos(camRot.tz), 0],
        [0, 0, 1]]);

      matt = Matrix.mult(Matrix.mult(matx, maty), matz);

      /*O.O(matx);
      O.O(maty);
      O.O(matz);
      O.O(matt);*/
      Profiler.end('EwTrig');
    };

    //The money function.
    var t = new Matrix.Matrix(3, 1);
    var perspectiveProjection = function(pt) {
      //Profiler.start("Project");
      var d = null; //new Matrix.Matrix(3,1);
      //var t = new Matrix.Matrix(3, 1); //translated
      t.setA([[pt.x - camLoc.x],
        [pt.y - camLoc.y],
        [pt.z - camLoc.z]]);
      d = Matrix.mult(matt, t);

      var mappedx = (d.get(0, 0) - viewLoc.x) * (viewLoc.z / d.get(2, 0));
      var mappedy = (d.get(1, 0) - viewLoc.y) * (viewLoc.z / d.get(2, 0));
      //O.O(d);
      //O.O("["+mappedx+","+mappedy+"]\n");
      //Profiler.end("Project");
      return {
        x: mappedx,
        y: mappedy,
        z: d.get(2, 0)
      };
    };


    return {
      map: perspectiveProjection,
      set: setProjection,
      Point: Point,
      Tri: Tri
    };
  }());



  var Canvas = (function() {
    var ctx = canvasEl.getContext('2d');

    var updateCanvasDimensions = function() {
      ctx.canvas.width = ctx.canvas.clientWidth;
      ctx.canvas.height = ctx.canvas.clientHeight;

      ctx.setTransform(
        1, 0, 0, 1, ctx.canvas.clientWidth / 2, ctx.canvas.clientHeight / 2);


      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(0,255,0,0.1)';

      ctx.lineJoin = 'bevel';
      ctx.linecap = 'square';
    };

    var clear = function() {
      //ctx.save();
      ctx.clearRect(
        -ctx.canvas.width / 2,
        -ctx.canvas.height / 2,
        ctx.canvas.width, ctx.canvas.height
      );
      //drawRectangle(-2, -2, 5, 5);

      //ctx.fillStyle = "rgba(32,32,64,1)";
      //ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      //ctx.restore();
    };

    var setLayer = function(layer) {
      //ctx.setTransform(0.6, 0.0, 0.4, 0.4, 20+10*layer, 20+60*layer);
      var z = -layer * 0.6644 + 0; //*48;
      var v6 = 2.44948974278318;
      var v2 = 1.4142135623731;
      var v3 = 1.73205080756888;

      //workign, but sizeways
      //ctx.setTransform(v3/v6, 1/v6, 0, v3/v6, -v3/v6*z, 1/v6*z);
      /*ctx.setTransform(0.707106781186548, 0.408244363752573,
      0, 0.81650050761069, -0.707106781186547 * z, 0.408244363752573 * z);
      */

      //ctx.setTransform(-v2/v6, -1/v6, v2/v6, -2/v6, 0, 0, 0);
      /*ctx.setTransform(0.707106781186548, 0.577353045773777, -0.707106781186547, 0.577353045773777, 0 * z, 0.577344715981264 * z );
      */

      //CORRECT:
      ctx.setTransform(0.707106781186548, -0.577353045773777, 0.707106781186547, 0.577353045773777, 0 * z, 0.577344715981264 * z);

      //Messing around:
      /*ctx.setTransform(0.707106781186548, -0.241844762647975, 0.707106781186547, 0.241844762647975, 0 * z, 0.939692620785908 * z); */

      ctx.scale(0.5, 0.5);
      ctx.translate(-300, 500);

    };


    var testBetweenLayers = function() {
      makeBox(64, 64, 64, 64, 128, 32);
      makeBox(80, 96, 96, 32, 64, 32);

      makeBox(64, 256, 64, 32, 32, 32);

      makeBox(256, 96, 64, 160, 32, 160);
      makeBox(320, 128, 128, 32, 128, 32);
      makeBox(256, 256, 64, 160, 32, 160);
    };

    var boxFaceFront = function(x, y, z, d, w, h) {
      ctx.beginPath();
      setLayer(z);
      ctx.moveTo(x + 0.5, y + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + 0.5, y + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + 0.5, y + w + 0.5);
      setLayer(z);
      ctx.lineTo(x + 0.5, y + w + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    var boxFaceSide = function(x, y, z, d, w, h) {
      ctx.beginPath();
      setLayer(z);
      ctx.moveTo(x + 0.5, y + w + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + 0.5, y + w + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + d + 0.5, y + w + 0.5);
      setLayer(z);
      ctx.lineTo(x + d + 0.5, y + w + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    var boxFaceTop = function(x, y, z, d, w, h) {
      ctx.beginPath();
      setLayer(z + h);
      ctx.moveTo(x + 0.5, y + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + 0.5, y + w + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + d + 0.5, y + w + 0.5);
      setLayer(z + h);
      ctx.lineTo(x + d + 0.5, y + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };


    var makeBox = function(x, y, z, d, w, h) {
      //Sides: 0yz(front), xDz, xyH
      ctx.fillStyle = "rgba(128,0,0,0.8)";
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      boxFaceFront(x, y, z, d, w, h);
      boxFaceSide(x, y, z, d, w, h);
      boxFaceTop(x, y, z, d, w, h);
    };

    var drawLine = function(xs, ys, xe, ye, col) {
      //O.O("[" + xs + "," + ys + "]-[" + xe + "," + ye + "]\n");
      ctx.beginPath();
      ctx.moveTo(xs + 0.5, ys + 0.5);
      ctx.lineTo(xe + 0.5, ye + 0.5);
      //ctx.closePath();
      ctx.strokeStyle = col || "#ffff00";
      ctx.lineWidth = 1;
      //ctx.lineJoin = "round";
      //ctx.linecap = "square"
      ctx.stroke();
    };
    
    var drawLine3d = function(pts,pte, col) {
      var ptmaps = _3d.map(pts);
      var ptmape = _3d.map(pte);
          var cull = false;
      if (ptmaps.z < 0) {
        cull = true;
      }
      if (ptmape.z < 0) {
        cull = true;
      }
      if (cull) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(ptmaps.x + 0.5, ptmaps.y + 0.5);
      ctx.lineTo(ptmape.x + 0.5, ptmape.y + 0.5);
      //ctx.closePath();
      ctx.strokeStyle = col || "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      //ctx.lineJoin = "round";
      //ctx.linecap = "square"
      ctx.stroke();
    };    

    var drawRectangle = function(xs, ys, w, h) {
      ctx.fillStyle = "rgba(255,128,16,1)";
      ctx.fillRect(xs, ys, w, h);
    };

    var drawTri = function(tri) {
      Profiler.start("Map");
      var pt1 = _3d.map(tri.a);
      var pt2 = _3d.map(tri.b);
      var pt3 = _3d.map(tri.c);
      Profiler.end("Map");
      Profiler.start("Canvas");
      var col = "#00ff00";
      var cull = false;
      if (pt1.z < 0) {
        cull = true;
      }
      if (pt2.z < 0) {
        cull = true;
      }
      if (pt3.z < 0) {
        cull = true;
      }
      if (cull) {
        col = "#440000";
        return;
      }
  /*drawLine(pt1.x, pt1.y, pt2.x, pt2.y,col);
      drawLine(pt2.x, pt2.y, pt3.x, pt3.y,col);
      drawLine(pt3.x, pt3.y, pt1.x, pt1.y,col);*/
      ctx.beginPath();
      ctx.moveTo(pt1.x + 0.05, pt1.y + 0.05);
      ctx.lineTo(pt2.x + 0.05, pt2.y + 0.05);
      ctx.lineTo(pt3.x + 0.05, pt3.y + 0.05);
      ctx.closePath();
      //ctx.strokeStyle = col || "#ffff00";
      //ctx.lineWidth = 1;
      //ctx.fillStyle = "rgba(0,255,0,0.1)";
  //attribute DOMString lineCap; // "butt", "round", "square" (default "butt")
  //attribute DOMString lineJoin; // "round", "bevel", "miter" (default "miter")        
      //ctx.lineJoin = "bevel";
      //ctx.linecap = "square";
      if (tri.style){
        ctx.fillStyle = tri.style.fill;
        ctx.strokeStyle = tri.style.stroke;
      }
      ctx.fill();
      ctx.stroke();

      Profiler.end("Canvas");

    };
    
    var drawDot = function(pt, colour, s){
      var ptmap = _3d.map(pt);
      ctx.fillStyle = colour;
      var size = s*5000/ptmap.z;
      ctx.fillRect(ptmap.x-size/2, ptmap.y-size/2, size, size);
      /*ctx.moveTo(ptmap.x-size/2, ptmap.y-size/2);
      ctx.arc(ptmap.x-size/2, ptmap.y-size/2, size, 0, 7, false);
      ctx.fill();*/
    };


    return {
      init: updateCanvasDimensions,
      getWidth: function() {
        return ctx.canvas.width;
      },
      getHeight: function() {
        return ctx.canvas.height;
      },
      Line: drawLine,
      Layer: setLayer,
      Rect: drawRectangle,
      test: testBetweenLayers,
      drawTri: drawTri,
      drawDot:drawDot,
      drawLine3d:drawLine3d,
      clear: clear
    };

  }());

  var Tests = (function() {

    var tris = [];
    var lines = [];
    var shadowlines = [];

    var testTetra = function() {
      var pt1 = new _3d.Point(100, 100, 10);
      var pt2 = new _3d.Point(210, 100, 10);
      var pt3 = new _3d.Point(100, 210, 10);
      var pt4 = new _3d.Point(100, 100, 210);
      var tri1 = new _3d.Tri(pt1, pt2, pt3);
      var tri2 = new _3d.Tri(pt2, pt3, pt4);
      var tri3 = new _3d.Tri(pt1, pt3, pt4);
      var tri4 = new _3d.Tri(pt1, pt2, pt4);
      Canvas.drawTri(tri1);
      Canvas.drawTri(tri2);
      Canvas.drawTri(tri3);
      Canvas.drawTri(tri4);
    };

    var pyramid = function(x, y, w, h,p, col) {
      if(!col){ col =[Math.floor(Math.random()*256),
            Math.floor(Math.random()*256),
            Math.floor(Math.random()*256)];
      }
      var stroke = "rgba("+0*col[0]+","+0*col[1]+","+0*col[2]+",1.0)";
      var fill = "rgba("+col[0]+","+col[1]+","+col[2]+",0.8)";          
      var style = {stroke:stroke, fill:fill};        
      var pt1 = new _3d.Point(x, y, 0);
      var pt2 = new _3d.Point(x + w, y, 0);
      var pt3 = new _3d.Point(x + w, y + h, 0);
      var pt4 = new _3d.Point(x, y + h, 0);
      var pt5 = new _3d.Point(x + w / 2, y + h / 2, p||50);

      //base
      tris.push(new _3d.Tri(pt1, pt2, pt3, style));
      tris.push(new _3d.Tri(pt1, pt3, pt4, style));

      //faces
      tris.push(new _3d.Tri(pt1, pt2, pt5, style));
      tris.push(new _3d.Tri(pt2, pt3, pt5, style));
      tris.push(new _3d.Tri(pt3, pt4, pt5, style));
      tris.push(new _3d.Tri(pt4, pt1, pt5, style));
    };

    var diamond = function(x, y, z, size, col) {
      if(!col){ col =[Math.floor(Math.random()*256),
            Math.floor(Math.random()*256),
            Math.floor(Math.random()*256)];
      }
      var stroke = "rgba("+col.r+","+col.g+","+col.b+",0.5)";          
      var fill = "rgba("+col.r+","+col.g+","+col.b+",0.5)";          
      
      var style = {stroke:stroke, fill:fill};
      var pt1 = new _3d.Point(x, y, z + size/2);
      var pt2 = new _3d.Point(x + size/2, y + size/2, z);
      var pt3 = new _3d.Point(x + size/2, y - size/2, z);
      var pt4 = new _3d.Point(x - size/2, y - size/2, z);
      var pt5 = new _3d.Point(x - size/2, y + size/2, z);
      var pt6 = new _3d.Point(x, y, z - size/2);

      //faces
      tris.push(new _3d.Tri(pt1, pt2, pt5, style));
      tris.push(new _3d.Tri(pt1, pt3, pt2, style));
      tris.push(new _3d.Tri(pt1, pt4, pt3, style));
      tris.push(new _3d.Tri(pt1, pt5, pt4, style));

      tris.push(new _3d.Tri(pt6, pt2, pt5, style));
      tris.push(new _3d.Tri(pt6, pt3, pt2, style));
      tris.push(new _3d.Tri(pt6, pt4, pt3, style));
      tris.push(new _3d.Tri(pt6, pt5, pt4, style));

    };


    var cube = function(x, y, w, h) {
      var col =[Math.floor(Math.random()*256),
            Math.floor(Math.random()*256),
            Math.floor(Math.random()*256)];
      var stroke = "rgba("+0*col[0]+","+0*col[1]+","+0*col[2]+",1.0)";
      var fill = "rgba("+col[0]+","+col[1]+","+col[2]+",0.8)";        
      var style = {stroke:stroke, fill:fill};
      var d = h;
      var pt1 = new _3d.Point(x, y, 0);
      var pt2 = new _3d.Point(x + w, y, 0);
      var pt3 = new _3d.Point(x + w, y + h, 0);
      var pt4 = new _3d.Point(x, y + h, 0);
      var pt5 = new _3d.Point(x, y, d);
      var pt6 = new _3d.Point(x + w, y, d);
      var pt7 = new _3d.Point(x + w, y + h, d);
      var pt8 = new _3d.Point(x, y + h, d);

      //base
      tris.push(new _3d.Tri(pt1, pt2, pt3, style ));
      tris.push(new _3d.Tri(pt1, pt3, pt4, style ));

      //top
      tris.push(new _3d.Tri(pt5, pt6, pt7, style ));
      tris.push(new _3d.Tri(pt5, pt7, pt8, style ));

      //front
      tris.push(new _3d.Tri(pt1, pt5, pt8, style ));
      tris.push(new _3d.Tri(pt1, pt4, pt8, style ));

      //back
      tris.push(new _3d.Tri(pt2, pt6, pt7, style ));
      tris.push(new _3d.Tri(pt2, pt3, pt7, style ));

      //left
      tris.push(new _3d.Tri(pt1, pt5, pt6, style ));
      tris.push(new _3d.Tri(pt1, pt2, pt6, style ));

      //right
      tris.push(new _3d.Tri(pt4, pt3, pt7, style ));
      tris.push(new _3d.Tri(pt4, pt8, pt7, style ));
    };


    var pyramidField = function() {
      for (var x = -1500; x < 1500; x += 150) {
        for (var y = -1500; y < 1500; y += 150) {
          if (Math.random() < 0.2) {
            pyramid(x, y, 50, 50,50);
          }
          else {
            if (Math.random() < 0.4) {
              cube(x, y, 50, 50);
            }
          }
        }
      }
    };

    /*var makeSolid = function(branch, radius, points){
      var step = Math.PI*2/points;
      var point1 = null;
      for (var i =0; i<Math.PI*2; i+=step){
        
      }
    };*/
    
    var tree = function(){
      var Stump = {s:new _3d.Point(0,0,0), e:new _3d.Point(0,0,100)};
      
    };

    var thinTree = function(x, y, levels, size, basecol, numsplits){
      var all = [];
      var current = [];
      var grown = [];
      var shadows = [];
      var a = 0.8;
      var targetcol = {r:0, g:64+Math.random()*128, b:0};
      var c=function(s){
        var r = (targetcol.r)*s + basecol.r*(1-s);
        var g = (targetcol.g)*s + basecol.g*(1-s);
        var b = (targetcol.b)*s + basecol.b*(1-s);
        return "rgba("+(r|0)+","+(g|0)+","+(b|0)+","+a.toFixed(2)+")";
      };
      current.push({start:{x:x, y:y, z:0}, end:{x:x, y:y, z:size}, colour:c(0.0)});

      for (var depth = 0; depth < levels; depth++){
        a = 0.8 - 0.8*((depth+1)/levels);           
        for (var branch = 0; branch < current.length; branch++){
          for (var splits = 0; splits < numsplits[depth]; splits ++){
            var thissize = size*0.2 + (size-size*0.2) * (levels-depth-1)/levels;

            var dx = current[branch].end.x - current[branch].start.x + 2*thissize*(Math.random()-0.5);
            var dy = current[branch].end.y - current[branch].start.y + 2*thissize*(Math.random()-0.5);
            var dz = current[branch].end.z - current[branch].start.z + 2*thissize*(Math.random()-0.5);
            var len = Math.sqrt(dx*dx+dy*dy+dz*dz);
            dx *= thissize/len;
            dy *= thissize/len;
            dz *= thissize/len;
            dx += current[branch].end.x;
            dy += current[branch].end.y;
            dz += current[branch].end.z;

            grown.push({
              start:current[branch].end,
              end:{x:dx, y:dy, z:dz},
              colour:c((depth+1)/levels)
            });

            shadows.push({
              start:{x:current[branch].end.x, y:current[branch].end.y, z:1},
              end:{x:dx, y:dy, z:1},
              colour:"rgba(0,0,0,0.2)"
            });
          }
        }
        all = all.concat(current);
        current = grown;
        grown = [];
        
      }

      shadowlines=shadowlines.concat(shadows);
      lines=lines.concat(all);

    }

    var draw = function() {
      Profiler.start("Sort");
      
      // tris.sort(function(t1, t2){
      //     var t1c = {x:(t1.a.x+t1.b.x+t1.c.x)/3,
      //                y:(t1.a.y+t1.b.y+t1.c.y)/3,
      //                z:(t1.a.z+t1.b.z+t1.c.z)/3};
      //     var t2c = {x:(t2.a.x+t2.b.x+t2.c.x)/3,
      //                y:(t2.a.y+t2.b.y+t2.c.y)/3,
      //                z:(t2.a.z+t2.b.z+t2.c.z)/3};
        
      //     var t1z = _3d.map(t1c).z;
      //     var t2z = _3d.map(t2c).z;            
        
      //     return t2z-t1z;
      // });
      
      Profiler.end("Sort");
      //Profiler.start("Draw");
      for (var i = 0; i < tris.length; i++) {
        Canvas.drawTri(tris[i]);
      }

      for (var i = 0; i < shadowlines.length; i++) {
        Canvas.drawLine3d(shadowlines[i].start, shadowlines[i].end, shadowlines[i].colour);
      }


      for (var i = 0; i < lines.length; i++) {
        Canvas.drawLine3d(lines[i].start, lines[i].end, lines[i].colour);
      }

      //Profiler.end("Draw");        
    };
    
    var grid = function(dx, dy, l){
      var col =[Math.floor(Math.random()*256),
            Math.floor(Math.random()*256),
            Math.floor(Math.random()*256)];
      var stroke = "rgba("+0*col[0]+","+0*col[1]+","+0*col[2]+",1.0)";
      var fill = "rgba("+col[0]+","+col[1]+","+col[2]+",0.8)";        
      var style = {stroke:stroke, fill:fill};  
      var b;
      for (var x = -l; x < l; x += dx) {
        for (var y = -l; y < l; y += dy) {
          b = Math.floor(Math.random()*2)*255;
          col = [b,b,b];
          stroke = "rgba("+col[0]+","+col[1]+","+col[2]+",1.0)";
          fill = "rgba("+col[0]+","+col[1]+","+col[2]+",1.0)";        
          style = {stroke:stroke, fill:fill};                  
          var pt1 = new _3d.Point(x, y, 0);
          var pt2 = new _3d.Point(x + dx, y, 0);
          var pt3 = new _3d.Point(x + dx, y + dy, 0);
          var pt4 = new _3d.Point(x, y + dy, 0);
          tris.push(new _3d.Tri(pt1, pt2, pt3, style ));
          tris.push(new _3d.Tri(pt1, pt3, pt4, style ));
        }        
      }
    };
    
    var terrain = function(nx,ny,s, h){
      var x;
      var y;
      
      var vec1;
      var vec2;
      var normal = [];
      var nleng = 0;
     
      //Set up random heights:
      var hField = [];
      for (x = 0; x < nx+1; x += 1) {
        hField[x] = [];
        for (y = 0; y < ny+1; y += 1) {
          hField[x][y] = Math.floor(Math.random()*h-h/2);
        }        
      }
      
      //Make the map
      var stroke = "rgba(0,30,0,1.0)";
      var fill = "rgba(0,32,0,1.0)";        
      var style = {stroke:stroke, fill:fill};                  
      var r,g,b;
      for (x = 0; x < nx; x += 1) {
        for (y = 0; y < ny; y += 1) {
          var pt1 = new _3d.Point(x*s-nx*s/2, y*s-ny*s/2, hField[x][y]);
          var pt2 = new _3d.Point(x*s+s-nx*s/2 , y*s-ny*s/2, hField[x+1][y]);
          var pt3 = new _3d.Point(x*s+s-nx*s/2, y*s+s-ny*s/2, hField[x+1][y+1]);
          var pt4 = new _3d.Point(x*s-nx*s/2, y*s+s-ny*s/2, hField[x][y+1]);
          
          vec1 = [pt1.x-pt2.x, pt1.y-pt2.y, pt1.z-pt2.z];
          vec2 = [pt1.x-pt3.x, pt1.y-pt3.y, pt1.z-pt3.z];      
          normal = [
            vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0]                        
            ];
          
          nleng = Math.sqrt(normal[0]*normal[0]+
            normal[1]*normal[1]+
            normal[2]*normal[2]);
          normal = [normal[0]/nleng, normal[1]/nleng, normal[2]/nleng];
          r=Math.floor((normal[2])*0);
          g=Math.floor((normal[2])*64);
          b=Math.floor((normal[2])*0);
          //O.O(normal[2]);

          //fill = "rgba("+r+","+g+","+b+",0.7)";   
          style = {stroke:stroke, fill:fill};    
          tris.push(new _3d.Tri(pt1, pt2, pt3, style ));
          
          
          vec1 = [pt1.x-pt3.x, pt1.y-pt3.y, pt1.z-pt3.z];
          vec2 = [pt1.x-pt4.x, pt1.y-pt4.y, pt1.z-pt4.z];      
          normal = [
            vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0]                        
            ];

          nleng = Math.sqrt(normal[0]*normal[0]+
            normal[1]*normal[1]+
            normal[2]*normal[2]);
          normal = [normal[0]/nleng, normal[1]/nleng, normal[2]/nleng];
          var c=Math.floor((normal[2])*255);

          //fill = "rgba("+r+","+g+","+b+",0.7)";   
          style = {stroke:stroke, fill:fill};    
          tris.push(new _3d.Tri(pt1, pt3, pt4, style ));
        }        
      }        
      
    };
    
    var dots = (function(){
      var list = [];
      var lasers = [];
      var explosions = [];
      
      var dotSize=2.0;
      
      
      var getCount = function(){
        return list.length;
      };
      
      var create = function(n){
        for(var i = 0; i < n; i++){
          var x = Math.random()*2000-1000;
          var y = Math.random()*2000-1000;
          var z = Math.random()*500+50;
          var pt = new _3d.Point(x,y,z);
          var vec = new _3d.Point(
            Math.random()-0.5,
            Math.random()-0.5,
            Math.random()-0.5                    
          );
          var a = new _3d.Point(0,0,0);
          var trail = [
            pt,pt,pt//,pt,pt
          ];
          list.push({p:pt, v:vec, a:a, t:trail, strain:1});
        }
      };
      
      var createAt = function(x,y,z,t){
        var pt = new _3d.Point(x,y,z);
        var vec = new _3d.Point(
          10*Math.random()-0.5,
          10*Math.random()-0.5,
          10*Math.random()-0.5                    
        );
        var a = new _3d.Point(0,0,0);
        var trail = [
          pt,pt,pt,pt,pt,pt,pt,pt
        ];
        list.push({
          p:pt, v:vec, a:a, t:trail, strain:1, type:t,
          maxLife:500,life:500, laserCD:10, laserHeat:0
        });
      };
      
      var draw = function(){
        var i;
        var col;
        var colStr;
        var alpha;
        var dmg;
        
        //explosions
        for(i = 0; i< explosions.length; i++){
          col = Math.floor(255*explosions[i].t/explosions[i].tmax);
          colStr = "rgba("+
            255+","+
            (col)+","+
            0+","+0.25+")";  
          
          if (explosions[i].smoke){
            colStr = "rgba("+
              (255-col)+","+
              (255-col)+","+
              (255-col)+","+0.05+")";
          }
          
          var m = explosions[i].size;
          var k = 4*m/(explosions[i].tmax*explosions[i].tmax);
          var s = m-k*Math.pow((explosions[i].t-explosions[i].tmax/2),2);
          
          Canvas.drawDot(
            {x:explosions[i].x,y:explosions[i].y, z:explosions[i].z}, 
            colStr,
            s
          );
          //O.C();
          //O.O(explosions.length + colStr+ "|"+JSON.stringify(xxx));  *              
        }    
        //shadow
        for(i = 0; i< list.length; i++){
          col = dotTypes[list[i].type].colour;
          colStr = "rgba("+
            Math.floor(col.r)+","+
            Math.floor(col.g)+","+
            Math.floor(col.b)+","+0.05+")";                
          Canvas.drawDot(
            {x:list[i].p.x,y:list[i].p.y, z:0}, 
            "rgba(0,0,0,0.3)",
            dotSize
          );
          Canvas.drawLine3d(
            {x:list[i].p.x,y:list[i].p.y, z:0}, 
            {x:list[i].t[0].x,y:list[i].t[0].y, z:0},
            "rgba(0,0,0,0.3)"
          );
          Canvas.drawLine3d(
            list[i].p, 
            {x:list[i].p.x,y:list[i].p.y, z:0}, 
            colStr
          );
          
        }     
        
        for(i = 0; i< list.length; i++){
          if (list[i].strain<0.5){list[i].strain = 0.5;}
          if (list[i].strain>2){list[i].strain = 2;}                
          var x = ((list[i].strain-0.5)/1.5*255);
          x = Math.floor(x);
          x=x%256;
          //var col = "rgba("+x+",255,255,0.75)";
          col = dotTypes[list[i].type].colour;
          alpha = 0.5;//0.3+0.7*Math.floor(10-(list[i].life/100)*10)/10;
          dmg = 1-list[i].life/list[i].maxLife;
          colStr = "rgba("+
            Math.floor(dmg*255+(1-dmg)*col.r)+","+
            Math.floor(dmg*0+(1-dmg)*col.g)+","+
            Math.floor(dmg*0+(1-dmg)*col.b)+","+alpha+")";
          Canvas.drawDot(list[i].p, colStr, dotSize);
          dmg=0;
          colStr = "rgba("+
            Math.floor(dmg*255+(1-dmg)*col.r)+","+
            Math.floor(dmg*0+(1-dmg)*col.g)+","+
            Math.floor(dmg*0+(1-dmg)*col.b)+","+alpha+")";
          Canvas.drawLine3d(list[i].p, list[i].t[0], colStr);
        }
        
        //lasers
        for(i = 0; i< lasers.length; i++){
          col = dotTypes[lasers[i].from.type].colour;
          alpha = lasers[i].pew*0.1;
          colStr = "rgba("+col.r+","+col.g+","+col.b+","+alpha+")";
          Canvas.drawLine3d(lasers[i].from.p,lasers[i].to.p, colStr);
        }
      };
      
      var calculate = function(){
        // var rules = {
        //     laserRange:150,
        //     repulse:100,
        //     repulseHard:25,
        //     //align:80,
        //     attract:300,
        //     overcrowd: 400,
        //     friction:0.995,
        //     cap:200
        // };

        // // from 30
        // var rules = {
        //     repulse:50,
        //     align:80,
        //     attract:250,
        //     friction:0.995,
        //     cap:200
        // };

        // // from ctrlfrk.com
        // var rules = {
        //   laserRange:75,
        //   repulse:50,
        //   repulseHard:12,
        //   //align:80,
        //   attract:140,
        //   overcrowd: 200,
        //   friction:0.995,
        //   cap:200
        // };

        var rules = {
          laserRange:75,
          attract:250,
          overcrowd: 200,
          repulse:50,
          repulseHard:12,

          // align:80,
          // friction:0.995,
          // cap:200
        };
        
        var power = 0;
        var dist;
        var vec;
        var ctr;
        var closest;
        var closeDist;
        
        for(var i = 0; i< list.length; i++){
          ctr=0;
          closest = null;
          for(var j = 0; j< list.length; j++){
            if (i===j){continue;}
            if (list[i].p.x - list[j].p.x > 200 ||
              list[i].p.x - list[j].p.x < -200 ||
              list[i].p.y - list[j].p.y > 200 ||
              list[i].p.y - list[j].p.y < -200 ||
              list[i].p.z - list[j].p.z > 200 ||
              list[i].p.z - list[j].p.z < -200 
              ){continue;}
            dist = Math.sqrt(
              Math.pow(list[i].p.x-list[j].p.x,2)+
              Math.pow(list[i].p.y-list[j].p.y,2)+
              Math.pow(list[i].p.z-list[j].p.z,2)
            );
            
            vec = {
              x:list[i].p.x-list[j].p.x,
              y:list[i].p.y-list[j].p.y,
              z:list[i].p.z-list[j].p.z
            };
            
            if(
              dist < rules.laserRange &&
              list[i].laserHeat ===0 &&
              list[i].type !== list[j].type &&
              (closest===null || dist < closeDist)
            ){
              closest = list[j];
              closeDist = dist;
            }
            
            if (dist<rules.attract && ctr<2){
              ctr++;
              list[i].v.x -= 1*vec.x/(dist+5);
              list[i].v.y -= 1*vec.y/(dist+5);
              list[i].v.z -= 1*vec.z/(dist+5);
            }
            if(dist<rules.overcrowd && ctr>4){
              list[i].a.x += 100*vec.x;
              list[i].a.y += 100*vec.y;
              list[i].a.z += 100*vec.z;
            }
            
            if (dist<rules.repulse){
              list[i].v.x += 4*vec.x/(dist+50);
              list[i].v.y += 4*vec.y/(dist+50);
              list[i].v.z += 4*vec.z/(dist+50);
            }

            if (dist<rules.repulseHard){
              list[i].v.x += 100*vec.x/(dist+50);
              list[i].v.y += 100*vec.y/(dist+50);
              list[i].v.z += 100*vec.z/(dist+50);
            }
            
            
          }
          
          //fire laser!
          if(closest !== null){
            list[i].laserHeat = list[i].laserCD;
            lasers.push({
              from:list[i],
              to:closest,
              pew:5
            });
          }
          
          //pull towards middle:
          
          dist = Math.sqrt(
            Math.pow(list[i].p.x-0,2)+
            Math.pow(list[i].p.y-0,2)+
            Math.pow(list[i].p.z-100,2)
          );
          
          vec = {
            x:list[i].p.x-0,
            y:list[i].p.y-0,
            z:list[i].p.z-100
          };
          
          list[i].a.x -= 0.000001*vec.x;
          list[i].a.y -= 0.000001*vec.y;
          list[i].a.z -= 0.000001*vec.z;                
                  
          //normalise

          var norm = Math.sqrt(
            Math.pow(list[i].v.x,2) +
            Math.pow(list[i].v.y,2) +
            Math.pow(list[i].v.z,2)
          );
          list[i].strain = norm;
          
          if(norm>2 || norm<0.5){
            list[i].v.x= 8 * list[i].v.x/norm;
            list[i].v.y= 8 * list[i].v.y/norm;
            list[i].v.z= 8 * list[i].v.z/norm;        
          }
          
          //bouncing
          var bncfrc = 1;
          if (list[i].p.z<0 && list[i].v.z < 0){
            list[i].v.z = -list[i].v.z;
          }
          if (list[i].p.y<-1000){
            list[i].v.y += bncfrc;
          }
          if (list[i].p.x<-1000){
            list[i].v.x += bncfrc;
          }
          if (list[i].p.z>200){
            list[i].v.z -= bncfrc;
          }
          if (list[i].p.y>1000){
            list[i].v.y -= bncfrc;
          }
          if (list[i].p.x>1000 ){
            list[i].v.x -= bncfrc;
          }              
          

          /*if(
            list[i].p.x < -1000 ||
            list[i].p.y < -1000 ||
            list[i].p.z < -100 ||
            list[i].p.x > 1000 ||
            list[i].p.y > 1000 ||
            list[i].p.z > 1000
            )
          {
            list[i].p = {x:0, y:0, z:200};
            list[i].t = [
              list[i].p,list[i].p,list[i].p,list[i].p,list[i].p
            ];                    
          }*/
        }            
      };
      
      var p = 0;
      var update = function(){
        p=p+1;
        var i;
        for(i = 0; i< lasers.length; i++){
          lasers[i].pew--;
          if(lasers[i].pew <=0){
            lasers[i].to.life-=25;
            
            explosions.push({
              x:lasers[i].to.p.x+25*(Math.random()-0.5),
              y:lasers[i].to.p.y+25*(Math.random()-0.5),
              z:lasers[i].to.p.z+25*(Math.random()-0.5),
              t:0,
              tmax:5,
              size:2,
              smoke:false
            });                    
            
            lasers.splice(i,1);
            i--;
            continue;
          }
        }
        
        for(i = 0; i< explosions.length; i++){
          explosions[i].t++;
          if(explosions[i].t>=explosions[i].tmax){
            if(explosions[i].smoke){
              explosions.splice(i,1);
              i--;
              continue;
            }
            else
            {
              explosions[i].smoke = true;
              explosions[i].t=0;
              explosions[i].tmax=50;
              explosions[i].size*=3;
            }
          }
        }            
        

        for(i = 0; i< list.length; i++){
          // Smoke trails for damaged ones
          
          if (list[i].life / list[i].maxLife < Math.random()*0.5 && Math.random() < 0.3){
            explosions.push({
              x:list[i].p.x+25*(Math.random()-0.5),
              y:list[i].p.y+25*(Math.random()-0.5),
              z:list[i].p.z+25*(Math.random()-0.5),
              t:0,
              tmax:40 + 0|Math.random()*40,
              size:2+0|Math.random()*3,
              smoke:true
            });
          }
          if(list[i].life <=0){
            explosions.push({
              x:list[i].p.x,
              y:list[i].p.y,
              z:list[i].p.z,
              t:0,
              tmax:50,
              size:5,
              smoke:false
            });
              
            list.splice(i,1);
            i--;

            continue;
          }
          
          /*if(list[i].life<list[i].maxLife){
            list[i].life++;
          }*/
          
          if(list[i].laserHeat > 0){
            list[i].laserHeat--;
          }
          
          list[i].p.x = list[i].p.x + list[i].v.x*0.5;
          list[i].p.y = list[i].p.y + list[i].v.y*0.5;
          list[i].p.z = list[i].p.z + list[i].v.z*0.5;
          
          list[i].v.x = list[i].v.x + list[i].a.x*0.5;
          list[i].v.y = list[i].v.y + list[i].a.y*0.5;
          list[i].v.z = list[i].v.z + list[i].a.z*0.5;
          
          if(p%1===0){
            p=0;
            list[i].t.shift();
            list[i].t.push(new _3d.Point(
              list[i].p.x,
              list[i].p.y,
              list[i].p.z
            ));
          }
        }            
      };
      
      return {
        create:create,
        draw:draw,
        update:update,
        calculate:calculate,
        createAt:createAt,
        getCount:getCount
      };
      
    }());
    
    var dotTypes=[
      {colour:{r:255,g:96,b:96}},
      {colour:{r:96,g:96,b:255}},
      {colour:{r:96,g:255,b:96}},        
      {colour:{r:255,g:96,b:255}},
      {colour:{r:255,g:255,b:255}}        
    ];
    
    var game = (function(){
      var spawners=[];
      var newSpawner = function(x,y,t,p,n,z){
        z=p/15;
        spawners.push({
          t:t,
          x:x-20,
          y:y-20,
          z:z,
          period:p,
          tick:0,
          num:n
        });
        //pyramid(x-20,y-20,40,40,z);
        pyramid(x-0.5*n,y-0.5*n,1*n,1*n,z, [64,64,64]);
        diamond(x,y,z,2*n, dotTypes[t].colour);
        
      };
      
      var tick = function(){
        //O.C();
        //O.O(dots.getCount());
        if (dots.getCount() > 1000){return;} //200
        for(var i =0; i<spawners.length; i++){
          if(spawners[i].tick === 0 ){
             spawners[i].tick = spawners[i].period;
            for (var j = 0; j<spawners[i].num; j++){ 
               dots.createAt(
                 spawners[i].x,
                 spawners[i].y,
                 spawners[i].z,
                 spawners[i].t
               );
            }
          }
          spawners[i].tick--;
        }
      };
      
      return{
        newSpawner:newSpawner,
        tick:tick
      };
      
    }());

    return {
      test1: testTetra,
      test2: pyramidField,
      draw: draw,
      grid: grid,
      ter:terrain,
      pyramid :pyramid,
      dots:dots,
      game:game,
      thinTree: thinTree        
    };

  }());


  var Flier = (function(){
    var loc = {x:120, y: 100, z:300};
    var face = {tx: Math.PI / 2, ty:0, tz:0};
    var step = 10;
    
    var mouseLast = null;
    
    var moveForward = function(){
      loc.y+=step;
    };
    var moveBackward = function(){
      loc.y-=step;
    };
    var moveLeft = function(){
      loc.x-=step;
    };
    var moveRight = function(){
      loc.x+=step;
    };
    var moveDown = function(){
      loc.z-=step;
    };
    var moveUp = function(){
      loc.z+=step;
    };    
    
    var handler = function(e){
      switch(e.keyCode)
      {
        case 37: Flier.l();break;
        case 38: Flier.f();break;
        case 39: Flier.r();break;
        case 40: Flier.b();break;
        case 32: Flier.u();break;
        case 67: Flier.d();break;

          
        case 13: paused = !paused; break;
          case 116:alert("NO!");return false;
        default:
          alert(e.keyCode);
          break;
      }
      Flier.remap();
    };
    
    var update = function(){
      _3d.set([loc.x, loc.y, loc.z], [face.tx, face.ty, face.tz], [0, 0, 250]);
      Canvas.clear();        
      Tests.draw();
    };
    
    return {
      u:moveUp,
      d:moveDown,
      l:moveLeft,
      r:moveRight,
      f:moveForward,
      b:moveBackward,
      h:handler,
      remap:update
    };



  }());

  // shim layer with setTimeout fallback
  var shimRequestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ /* element */){
          window.setTimeout(callback, 1000 / 60);
        };
  })();


  var start = function(){

    O.S('output');

    Canvas.init();
    _3d.set([1200, 1200, 100], [0, 0, 0], [0, 0, 20]);

    Tests.ter(5,5,400, 80);
    // x, y, team, timer, number, z
    //Tests.pyramid(-20,-20,40,40,200);
    //Tests.pyramid(200,-20,40,40,100);
    //Tests.dots.create(200);

    //Tests.game.newSpawner(-1600,1600,0,500,5,100);
    Tests.game.newSpawner(-900,900,0,1000,15,500);
    //Tests.game.newSpawner(-600,900,0,200,1,100);
    //Tests.game.newSpawner(-900,600,0,200,1,100);

    //Tests.game.newSpawner(1600,-1600,1,500,5,100);
    Tests.game.newSpawner(900,-900,1,1000,15,500);
    //Tests.game.newSpawner(600,-900,1,200,1,100);
    //Tests.game.newSpawner(900,-600,1,200,1,100);

    //Tests.game.newSpawner(-1600,-1600,2,500,5,100);
    Tests.game.newSpawner(-900,-900,2,1000,15,500);
    //Tests.game.newSpawner(-600,-900,2,200,1,100);
    //Tests.game.newSpawner(-900,-600,2,200,1,100);

    //Tests.game.newSpawner(1600,1600,3,500,5,100);
    Tests.game.newSpawner(900,900,3,1000,15,500);
    //Tests.game.newSpawner(600,900,3,200,1,100);
    //Tests.game.newSpawner(900,600,3,200,1,100);

    Tests.game.newSpawner(0,0,4,2000,35,200);

    // Tests.game.newSpawner(200,200,4,50,1,200);
    // Tests.game.newSpawner(200,-200,4,50,1,200);
    // Tests.game.newSpawner(-200,-200,4,50,1,200);
    // Tests.game.newSpawner(-200,200,4,50,1,200);

    // for (var forest = 0; forest < 2; forest++){
    //     Tests.thinTree(4000*(Math.random()-0.5),4000*(Math.random()-0.5),6,Math.random()*40+80, {r:Math.random()*127+64, g:64, b:Math.random()*64}, [5,4,3,3,3,3]);
    // }

    for (var forest = 0; forest < 10; forest++){
      Tests.thinTree(100+1600*(Math.random()-0.5),100+1600*(Math.random()-0.5),4,Math.random()*40+100, {r:Math.random()*127+64, g:64, b:Math.random()*64}, [6,4,3,0,0,0]);
    }

    // for (var forest = 0; forest < 200; forest++){
    //     Tests.thinTree(4000*(Math.random()-0.5),4000*(Math.random()-0.5),3,Math.random()*10+20, {r:Math.random()*127+64, g:64, b:Math.random()*64}, [5,3,3,3,3,3]);
    // }

    var ang = 0;
    var up = false;
    var h = 1200;

    var rad = 1800;
    var frames = 0, maxFrames = 10, start = Date.now(), curfps=0, now, fps;

    var runLoop = function(){
      Canvas.clear();
      _3d.set([rad*Math.cos(ang), rad*Math.sin(ang), h+100], [Math.PI / 2 + Math.PI/4 * ((h-700) / 600), 0, 3*Math.PI/2-ang], [0, 0, 800]);
      Tests.draw();  //leak
      Tests.dots.update();
      Tests.dots.calculate();    //leak with tick
      Tests.dots.draw();  //leak with tick
      Tests.game.tick();
      if (up) {
        //h++;
      } else {
        //h--;
      }
      if (h < 200) {
        up = true;
      }
      if (h > 800) {
        up = false;
      }
      ang += 0.002;

      //Frame counting code:
      // frames++;
      // if (frames > maxFrames){
      //     now = Date.now();
      //     fps = (now-start)/maxFrames;
      //     curfps = (curfps + fps)/2;
      //     start = now;
      //     frames = 0;
      //     O.C();
      //     O.O('Fps: ' + curfps.toFixed(2));

      // }

      /*Profiler.start("Output");
      O.C();
      O.O(Profiler.output());
      Profiler.end("Output");*/
      //Tests.dots.create(1);
      shimRequestAnimFrame(runLoop);
    };

    runLoop();
  };

  // window.addEventListener('resize', function(){
  //    Canvas.init();
  // });

  return start;
};

const Swarm = () => {
  const outputRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (outputRef.current && canvasRef.current) {
      const start = dothething(canvasRef.current, outputRef.current);
      start();
    }
  }, []);

  return <div>
    <canvas ref={canvasRef} />
    <div ref={outputRef}><div /></div>
  </div>;
};

export { Swarm };