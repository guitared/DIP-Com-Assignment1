/*
	Guitared pgm render libary 
	version:	1
	created: 	16/2/2015 
	======================================
*/

//-----------------------------
//Image Object
//-----------------------------

  function Image(w,h,max,data){
	this.width = w;
	this.height = h;
	this.maxlevel = max;
	this.data = [];
	this.raw_data = data;
	this.density = [];
	for(i=0;i<256;i++){this.density.push(0);}
	var treshold = 0;
	var length = data.length;
	for(i = 0; i < length; i++){
		var val = data[i].charCodeAt(0);// convert ASCII to int (0-255)
		treshold+= val;
		this.density[val]++;
		this.data.push(val);
	}
	this.treshold = treshold/length;
	this.length=length;
  }
  
//-----------------------------
// Rendering
//-----------------------------
function drawImage(str,img,isBinary){ // image Object
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = img.width;
	new_canvas.height = img.height;
	container.appendChild(new_canvas);
	for(i = 0; i < img.length; i++){
		var value = img.data[i] * ((isBinary)?255:1);
		new_ctx.fillStyle = "rgb("+value+','+value+','+value+')';
		new_ctx.fillRect((i%img.width),Math.floor(i/img.width),1,1);
	}
	return new_ctx;
}

function drawHistogram(str,img){
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = 275;
	new_canvas.height = 120;
	container.appendChild(new_canvas);
	var max = 0;
	for(i=0;i<256;i++){if(img.density[i]>max)max=img.density[i];}
	var p = 10.5;
	//pdf
	for(var i=0;i<256;i++){
		new_ctx.beginPath();
		new_ctx.moveTo(i+p,100+p);
		new_ctx.lineTo(i+p,100-(img.density[i]/max*100)+p);
		new_ctx.stroke();
	}
	//cdf
	new_ctx.fillStyle = "rgba(255,0,0,0.5)";
	var den = 0;
	for(i=0;i<256;i++){
		den+=img.density[i];
		new_ctx.fillRect(i+p,100-((den/img.length)*100)+p,1,1);
	}
	return new_ctx;
}

/************************************CHOICE 1************************************/

//-----------------------------
// Transform
//-----------------------------
function findObjects(img,noise_treshold){
	var objects = [];
	
	for(i=0;i<256;i++){
	if(img.density[i]>noise_treshold){
		var x = {};
		x.value = i;
		x.density = img.density[i];
		objects.push(x);
		}
	}
	return objects;
}

function createBinaryObject(img,obj_value){
	var temp_image = new Image(img.width,img.height,img.maxlevel,img.raw_data);
	for(i=0;i<256;i++){temp_image.density[i]=0;}
	for(i = 0; i < temp_image.length; i++){
		var val=(temp_image.data[i]==obj_value)?1:0;
		temp_image.data[i] = val;
		temp_image.density[val]++;
	}
	return temp_image;
}

//-----------------------------
// Binary function
//-----------------------------
function m00(img){
	var sum = 0;
	for(i=1;i<img.length;i++){
		sum += img.data[i];
	}
	return sum;
}

function m01(img){
	var sum = 0;
	for(i=1;i<img.length;i++){
		sum += Math.floor(i/img.width)*img.data[i];
	}
	return sum;
}

function m10(img){
	var sum = 0;
	for(i=1;i<img.length;i++){
		sum += (i%img.width)*img.data[i];
	}
	return sum;
}

function u00(img){
	return m00(img);
}

function xp(img){
	return m10(img)/m00(img);
}

function yp(img){
	 return m01(img)/m00(img);
}

function u20(img){
	var xxp = xp(img);
	var sum = 0;
	for(i=1;i<img.length;i++){
		var x = (i%img.width);
		sum += (x-xxp)*(x-xxp)*img.data[i];
	}
	return sum;
}

function u02(img){
	var yyp = yp(img);
	var sum = 0;
	for(i=1;i<img.length;i++){
		var y = Math.floor(i/img.width);
		sum += (y-yyp)*(y-yyp)*img.data[i];
	}
	return sum;
}

function n20(img){
	var ud = u00(img);
	return u20(img)/(ud*ud);
}

function n02(img){
	var ud = u00(img);
	return u02(img)/(ud*ud);
}

function q1(img){
		return n20(img) + n02(img);
}

/************************************CHOICE 2************************************/

function createEqualizedImage(img){
	var temp_image = new Image(img.width,img.height,img.maxlevel,img.raw_data);
	var density = [];
	var covto = [];
	var a0=0;
	for(var i=0;i<256;i++){
		density.push(0);
		covto.push(0);
		a0+=temp_image.density[i]/temp_image.length; //find cdf
		var cdf = Math.round(a0*255);
		density[cdf]+=temp_image.density[i];
		covto[i]=cdf; //histrogram matching
		temp_image.density[i] = 0; //flush histrogram
	}
	for(i = 0; i < temp_image.length; i++){
		var val=temp_image.data[i];
		temp_image.data[i] = covto[val];
		temp_image.density[covto[val]]++;
	}
	return temp_image;
}

/************************************CHOICE 3************************************/
function drawRGBImage(str,red_img,green_img,blue_img){
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = red_img.width;
	new_canvas.height = red_img.height;
	container.appendChild(new_canvas);
	for(i = 0; i < red_img.length; i++){
		new_ctx.fillStyle = "rgb("+red_img.data[i]+','+green_img.data[i]+','+blue_img.data[i]+')';
		new_ctx.fillRect((i%red_img.width),Math.floor(i/red_img.width),1,1);
	}
	return new_ctx;
}

function drawExcessGreenImage(str,red_img,green_img,blue_img){
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = red_img.width;
	new_canvas.height = red_img.height;
	container.appendChild(new_canvas);
	for(i = 0; i < red_img.length; i++){
		var r = red_img.data[i];
		var g = green_img.data[i];
		var b = blue_img.data[i];
		var value = Math.min(Math.max((2*g)-r-b,0),255);
		new_ctx.fillStyle = "rgb("+value+','+value+','+value+')';
		new_ctx.fillRect((i%red_img.width),Math.floor(i/red_img.width),1,1);
	}
	return new_ctx;
}

function drawRedBlueDifferenceImage(str,red_img,green_img,blue_img){
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = red_img.width;
	new_canvas.height = red_img.height;
	container.appendChild(new_canvas);
	for(i = 0; i < red_img.length; i++){
		var r = red_img.data[i];
		var g = green_img.data[i];
		var b = blue_img.data[i];
		var value = Math.min(Math.max(r-b,0),255);
		new_ctx.fillStyle = "rgb("+value+','+value+','+value+')';
		new_ctx.fillRect((i%red_img.width),Math.floor(i/red_img.width),1,1);
	}
	return new_ctx;
}

/************************************CHOICE 4************************************/

function drawControlRegion(str,reg){
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_ctx.fillStyle = 'black';
	new_ctx.fillRect(0,0,256,256);
	new_canvas.width = 256;
	new_canvas.height = 256;
	container.appendChild(new_canvas);
	for(i = 0; i < reg.length; i++){
		new_ctx.strokeStyle = 'rgb('+i+','+i+','+i+')';
		new_ctx.fillStyle = 'rgb('+i+','+i+','+i+')';
		new_ctx.beginPath();
		new_ctx.moveTo(reg[i].x1,reg[i].y1);
		new_ctx.lineTo(reg[i].x2,reg[i].y2);
		new_ctx.lineTo(reg[i].x4,reg[i].y4);
		new_ctx.lineTo(reg[i].x3,reg[i].y3);
		new_ctx.fill();
		new_ctx.stroke();
	}
	return new_ctx;
	/*
	var imgData=new_ctx.getImageData(0,0,256,256);
	var control_region_index=[];
	for (var i=0;i<imgData.data.length;i+=4)
	{
		control_region_index.push(imgData.data[i]);
	}
	return control_region_index;
	*/
}

function drawUndistortImage(str,img,reg,wx,wy){
	var temp_image = new Image(img.width,img.height,img.maxlevel,img.raw_data);
	var h3 = document.createElement("h3");
	h3.innerText = str;
	container.appendChild(h3);
	var new_canvas = document.createElement("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_canvas.width = temp_image.width;
	new_canvas.height = temp_image.height;
	container.appendChild(new_canvas);
	for(i = 0; i < temp_image.length; i++){
		var xx = i%temp_image.width;
		var yy = Math.floor(i/temp_image.width);
		var x = Math.floor((i%temp_image.width)/16);
		var y = Math.floor(Math.floor(i/temp_image.height)/16);
		var r = (16*y)+x; // control region index
		var c = wx[r];
		var d = wy[r];
		var posx = Math.round((c[0]*xx)+(c[1]*yy)+(c[2]*xx*yy)+c[3]);
		var posy = Math.round((d[0]*xx)+(d[1]*yy)+(d[2]*xx*yy)+d[3]);
		temp_image.data[i]=img.data[(img.width*posy)+posx]; // backward interpolation
		var value = temp_image.data[i];
		new_ctx.fillStyle = "rgb("+value+','+value+','+value+')';
		new_ctx.fillRect((i%temp_image.width),Math.floor(i/temp_image.width),1,1);
	}
}

function generateWx(reg){
	var w = [];
	for(i=0;i<reg.length;i++){
		var row = [];
		var x = i%16;
		var y = Math.floor(i/16);
		var x1 = reg[i].x1;
		var x2 = reg[i].x2;
		var x3 = reg[i].x3;
		var x4 = reg[i].x4;
		var xp1 = x*16;
		var xp2 = xp1+16;
		var xp3 = xp1;
		var xp4 = xp2;
		var yp1 = y*16;
		var yp2 = yp1;
		var yp3 = yp1+16;
		var yp4 = yp3;
		var col = [];col.push(xp1);col.push(yp1);col.push(xp1*yp1);col.push(1);col.push(x1);row.push(col);
		var col = [];col.push(xp2);col.push(yp2);col.push(xp2*yp2);col.push(1);col.push(x2);row.push(col);
		var col = [];col.push(xp3);col.push(yp3);col.push(xp3*yp3);col.push(1);col.push(x3);row.push(col);
		var col = [];col.push(xp4);col.push(yp4);col.push(xp4*yp4);col.push(1);col.push(x4);row.push(col);
		var wx = gauss(row);
		w.push(wx);
	}
	return w;
}

function generateWy(reg){
	var w = [];
	for(i=0;i<reg.length;i++){
		var row = [];
		var x = i%16;
		var y = Math.floor(i/16);
		var y1 = reg[i].y1;
		var y2 = reg[i].y2;
		var y3 = reg[i].y3;
		var y4 = reg[i].y4;
		var xp1 = x*16;
		var xp2 = xp1+16;
		var xp3 = xp1;
		var xp4 = xp2;
		var yp1 = y*16;
		var yp2 = yp1;
		var yp3 = yp1+16;
		var yp4 = yp3;
		var col = [];col.push(xp1);col.push(yp1);col.push(xp1*yp1);col.push(1);col.push(y1);row.push(col);
		var col = [];col.push(xp2);col.push(yp2);col.push(xp2*yp2);col.push(1);col.push(y2);row.push(col);
		var col = [];col.push(xp3);col.push(yp3);col.push(xp3*yp3);col.push(1);col.push(y3);row.push(col);
		var col = [];col.push(xp4);col.push(yp4);col.push(xp4*yp4);col.push(1);col.push(y4);row.push(col);
		var wy = gauss(row);
		w.push(wy);
	}
	return w;
}

/** Solve a linear system of equations given by a n&times;n matrix 
    with a result vector n&times;1. */
function gauss(A) {
    var n = A.length;

    for (var i=0; i<n; i++) {
        // Search for maximum in this column
        var maxEl = Math.abs(A[i][i]);
        var maxRow = i;
        for(var k=i+1; k<n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (var k=i; k<n+1; k++) {
            var tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }

        // Make all rows below this one 0 in current column
        for (k=i+1; k<n; k++) {
            var c = -A[k][i]/A[i][i];
            for(var j=i; j<n+1; j++) {
                if (i==j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    var x= new Array(n);
    for (var i=n-1; i>-1; i--) {
        x[i] = A[i][n]/A[i][i];
        for (var k=i-1; k>-1; k--) {
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
}