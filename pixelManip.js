const picturesArr = ['./Assets/Images/Maine1.jpg','./Assets/Images/Nasa1.jpg', './Assets/Images/Apollo11.jpg', './Assets/Images/Tahoe1.jpg', './Assets/Images/Maine2.jpg', './Assets/Images/Utah1.jpg', './Assets/Images/Profile_Pic.png', './Assets/Images/Maine3.jpg', './Assets/Images/Maine5.jpg', './Assets/Images/NC1.jpg', './Assets/Images/Dolomite1.jpg', './Assets/Images/Carmel1.jpg'];
let pictureIndex = 0;
const picNavForward = document.getElementById('forward');
const picNavBackward = document.getElementById('back');
const clear = document.getElementById('clear');
const sub = document.getElementById('submit');
const form = document.getElementById("channels");
const quantize = document.getElementById('quantize');
const mainDriverButtons = document.getElementById('mainDriverbuttons');
const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
const paletteCanvas = document.getElementById('pal');
const ctxPal = paletteCanvas.getContext('2d');
const textOut = document.getElementById('textOut');
let outPal;
const palDataButton = document.getElementById('palDataExpand');
textOut.style.color = 'red';
let img = new Image();
let pictureBool = 0;
let imgOne = './Poppy.jpg';
let imgTwo = './Saturn.jpg';
img.onload = init; img.crossOrigin = "";
img.src = `${picturesArr[pictureIndex]}`;
let data;

function init() {
    setup(this);
    data = getHistoDataJSON(getCountsData(ctx.getImageData(0,0, c.width, c.height), 128));
    dMain(data);
}

function setup(img) {
    let svg = document.getElementsByTagName('svg');
    svg = '';
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);;
    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
    quantize.style.display = "none";
    textOut.innerHTML = "";
}

//image nav
picNavForward.addEventListener("click", function(event) {
    event.preventDefault();

    if(pictureIndex === picturesArr.length-1) {
	pictureIndex = -1;
	
    }
    pictureIndex++;
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});
//image nav
picNavBackward.addEventListener("click", function(event) {
    event.preventDefault();
    if(pictureIndex === 0) {
	pictureIndex = picturesArr.length;
	
    }
    pictureIndex--;
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});
// clear filter
clear.addEventListener("click", function(event) {
    event.preventDefault();
    img.src = `${picturesArr[pictureIndex]}`;
    setup(img);

    
});
// reveals palette data
palDataButton.addEventListener("click", function(event) {
    
    event.preventDefault();
    textOut.innerHTML = JSON.stringify(outPal);
    
    

    
});

//handle palette submit  keypress
form.onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
	e.preventDefault();
	setup(img);
	let channels  = form.value;
	if(powerOfTwo(channels)) {
	    textOut.innerHTML = "";
	    outPal = medianCutPalette(channels);
	    quantize.style.display = "block";
	    textOut.style.color = 'blue';
	    
	    
	} else {
	    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	    textOut.innerHTML = "Must be power of 2";
	}
	return false;
    };
};

//handle palette submit button
sub.addEventListener("click", function(event) {
    event.preventDefault();
    setup(img);
    let  channels = form.value;
    if(powerOfTwo(channels)) {
	textOut.innerHTML = "";
	outPal = medianCutPalette(channels);
	quantize.style.display = "block";
	    textOut.style.color = 'blue';
	    
	} else {
	    ctxPal.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
	    textOut.innerHTML = "Must be power of 2";
	}
	
    });
// handle quantize button lick
quantize.addEventListener("click", function(event) {
    event.preventDefault();
    let idataSrc = ctx.getImageData(0,0, c.width, c.height),
	idataTrg = ctx.createImageData(c.width, c.height);
    compressColors(outPal, idataSrc, idataTrg);
    data = getHistoDataJSON(getCountsData(ctx.getImageData(0,0, c.width, c.height), 128));
    dMain(data);
    
    
});


// main driver
function medianCutPalette (num) {

    // set up initial image source and target container
    let idataSrc = ctx.getImageData(0,0, c.width, c.height),
	idataTrg = ctx.createImageData(c.width, c.height);
    
    let pal = getPal(idataSrc, num);
    createPal(paletteCanvas, pal, ctxPal);
    
    return pal;
};


//get the palette values
function getPal(src, num) {
    
    let dataSrc = src.data,
	len = dataSrc.length;
    let pixelSet = [];

    for (let i = 0;i < len; i += 4) {
	let groupedPixelData = [dataSrc[i], dataSrc[i+1], dataSrc[i+2]];
	pixelSet.push(groupedPixelData);
    }

    // super inefficient way of getting rid of unique colors?
    let uniqueColorSet = [...new Set(pixelSet.map(color => color.toString()))];
    let uniqueColorsArr = uniqueColorSet.map(color => color.split(','));
    //get the initial max range color for the whole "bucket"
    let maxRangeInitial = getMaxRangeColorIndex(uniqueColorsArr);
    uniqueColorsArr.sort(function(a, b) {return +a[maxRangeInitial] - +b[maxRangeInitial];});
    
    let bucketsArr = [];
    // use cut to seperate into buckets and get max range color for each bucket, sort by that
    cut(uniqueColorsArr, bucketsArr, uniqueColorsArr, num);
    // get the color averages for each bucket
    let palette = getColorAverages(bucketsArr);
    
    return palette;
}

//palette display setup
function createPal (palletteCanvas, palette, ctxPal) {
    //arrange by sums
    palette.sort(function(a,b) {return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
    let xPlace = 0;
    let yPlace = 0;
    let row = Math.ceil(Math.sqrt(palette.length));
    palletteCanvas.height = (palette.length/row * 30) + 30;
    palletteCanvas.width  = (palette.length/row * 30) + 30;

    for(let i = 0; i < palette.length; i++) {
	if(i%row === 0 && i != 0) {
	    yPlace += 30;
	    xPlace = 0;
	}
	ctxPal.fillStyle = `rgb(${palette[i][0]}, ${palette[i][1]}, ${palette[i][2]})`;
	ctxPal.fillRect(xPlace, yPlace, 30, 30 );
	xPlace += 30;
    }
    
}




function compressColors (pal,src, trg) {
    let dataSrc = src.data;
    let dataTrg = trg.data;
    let len = dataSrc.length;
    for (let i = 0; i < len; i += 4) {
	let shortest = 255;
	let shortestIndex;
	for(let j = 0; j < pal.length; j++) {
	    let dist = getDistance(pal[j], [dataSrc[i], dataSrc[i+1], dataSrc[i+2]]);
	    if (dist < shortest) {
		shortest = dist;
		shortestIndex = j;
	    }
	}
	dataTrg[i] = pal[shortestIndex][0];
	dataTrg[i+1] = pal[shortestIndex][1];
	dataTrg[i+2] = pal[shortestIndex][2];
	dataTrg[i+3] = 255;
	
    }

    ctx.putImageData(trg, 0, 0);
    return trg;
}


function getDistance(a, b) {
    let dist = Math.sqrt(Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2], 2));
    return dist;
}


function getColorAverages (bucketsArr) {
    let palette = [];
    bucketsArr.forEach(bucket => {
	let red = 0, green = 0, blue = 0;
	
	bucket.forEach(color => {
	    red += +color[0];
	    green += +color[1];
	    blue += +color[2];
	});
	let avgR = Math.floor(red/bucket.length);
	let avgG = Math.floor(green/bucket.length);
	let avgB = Math.floor(blue/bucket.length);

	let avg = [avgR, avgG, avgB];
	palette.push(avg);
    });
    return palette;
}

// make color buckets
function cut (arr, bucketsArr, master, buckets){
    if(buckets === 1) {
	bucketsArr.push(arr);
	return;
    } else {
	buckets /= 2;
	// get max range for each bucket and sort by that
	let maxRange = getMaxRangeColorIndex(arr);
	arr.sort(function(a, b) {return +a[maxRange] - +b[maxRange];});
	let middle = Math.floor(arr.length/2);
	let firstHalf = arr.slice(0, middle-1);
	let secondHalf = arr.slice(middle);
	cut(firstHalf, bucketsArr, master, buckets);
	cut(secondHalf, bucketsArr, master, buckets);
    }
}
// takes processed color groups instead of canvas data array
function getMaxRangeColorIndex (src) {
    
    let len = src.length;
    let rMin = 255;
    let rMax = 0;
    let gMin = 255;
    let gMax = 0;
    let bMin = 255;
    let bMax = 0;
    for (let i = 0; i < len; i ++) {
	let red = +src[i][0];
	let green = +src[i][1];
	let blue = +src[i][2];

	if(red < rMin) {
	    rMin = red;
	}
	if(red > rMax) {
	    rMax = red;
	}
	if(green < gMin) {
	    gMin = green;
	}
	if(green > gMax) {
	    gMax = green;
	}
	if(blue < bMin) {
	    bMin = blue;
	}
	if(blue > bMax) {
	    bMax = blue;
	}
    }
    let rRange = rMax - rMin;
    let gRange = gMax - gMin;
    let bRange = bMax - bMin;

    let set = [[rRange, 0], [gRange, 1], [bRange, 2]];
    set.sort(function(a, b){return a[0] - b[0];});
    return set[set.length-1][1];
}

function powerOfTwo(x) {
    return (Math.log(x)/Math.log(2)) % 1 === 0;
}


function getColorGroups (src) {
    let dataSrc = src.data;
    let len = dataSrc.length;
    let rVals = [];
    let gVals = [];
    let bVals = [];
    let rgbValsTot = [];
    for (let i = 0; i < len; i += 4) {
	rVals.push(dataSrc[i]);
	gVals.push(dataSrc[i+1]);
	bVals.push(dataSrc[i+2]);
    }
    rgbValsTot = [rVals, gVals, bVals];
    return rgbValsTot;
}

function getChannelRange (channelVals) {
    channelVals.sort(function(a, b){return a - b;});
    const channelRange = [channelVals[0], channelVals[channelVals.length-1]];
    return channelRange;
}

function getSetHistoBins (channelRange, binCount) {
    let binRangeRaw = (channelRange[1]-channelRange[0])/binCount;
    let begin = channelRange[0];
    let binRangesTot = [];
    for (let i = 0; i < binCount; i++) {
	let range = [];
	range.push(begin);
	range.push(begin+binRangeRaw);
	begin += binRangeRaw;
	binRangesTot.push(range);
    }
    return binRangesTot;
}

function countItemsInRange (channelVals, binRangesTot) {
    let binCounts = [];
    for (let i = 0; i < binRangesTot.length; i++) {
	let lowerBound = binRangesTot[i][0];
	let upperBound = binRangesTot[i][1];
	let count = [];
	for (let j = 0; j < channelVals.length; j++) {
	    let val = channelVals[j];
	    if (val >= lowerBound && val <= upperBound) {
		count++;
	    }
	    
	}
	binCounts.push([binRangesTot[i],count]);
    }
    return binCounts;
}

function getCountsData (src, binCount) {
    let rgbValsTot = getColorGroups(src);
    // create seperate arrays for r, g, and b channel values for each pixel
    let rVals = rgbValsTot[0];
    let gVals = rgbValsTot[1];
    let bVals = rgbValsTot[2];
    // get the range for each channel
    // let rRange = getChannelRange(rVals);
    // let gRange = getChannelRange(gVals);
    // let bRange = getChannelRange(bVals);
    //create the histogram bins based on the range data
    let binRangesTotRed = getSetHistoBins([0, 256], binCount);
    let binRangesTotGreen = getSetHistoBins([0, 256], binCount);
    let binRangesTotBlue = getSetHistoBins([0, 256], binCount);
    // count the colors that fall wthin each bin
    let rCounts = countItemsInRange(rVals, binRangesTotRed);
    let gCounts =countItemsInRange(gVals, binRangesTotGreen);
    let bCounts = countItemsInRange(bVals, binRangesTotBlue);
    // return counts and their corresponding ranges
    return [[rCounts, gCounts, bCounts], [[0, 256], [0, 256], [0, 256]]];
}

function getHistoDataJSON (arrDataTots) {

    let data = {red: {},
		green: {},
		blue: {}
	       };
    let rangeIndex = 0;
    for (let color in data) {
	
	data[color].rangeTotal = arrDataTots[1][rangeIndex];
	data[color].binData = arrDataTots[0][rangeIndex];
	rangeIndex++;
	};
	
    
    
    return data;
    
}

// d3 boilerplate
function dMain (data) {
    let container = document.getElementById('svgContainer');
while (container.firstChild) {
    container.removeChild(container.firstChild);
}
    for (let key in data) {

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 800 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);
          
// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#svgContainer").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", `${key}`)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");
    

	let thisSVG = document.getElementById(`${key}`);
	thisSVG.style.left = `${c.width +1}px`;
	thisSVG.style.top = `100px`;

// get the data
  // format the data
    
    data[key].binData.forEach(function(d) {
      d.colorCounts = +d[1];
      d.binRange = d[0];
  });

  // Scale the range of the data in the domains
  x.domain(data[key].binData.map(function(d) { return d.binRange; }));
  y.domain([0, d3.max(data[key].binData, function(d) { return d.colorCounts; })]);

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
      .data(data[key].binData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.binRange); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.colorCounts); })
	    .attr("height", function(d) { return height - y(d.colorCounts); });

  

	let bars = [...thisSVG.getElementsByClassName("bar")];
	for (let i = 0; i < bars.length; i++) {
	   
	    if (key === "red") {
		
		bars[i].style.fill = `rgb(${data[key].binData[i][0][1]}, 0, 0`;
	    } else if (key === "green") {
		bars[i].style.fill = `rgb(0, ${data[key].binData[i][0][1]}, 0`;
	    } else if (key === "blue") {
		bars[i].style.fill = `rgb(0, 0, ${data[key].binData[i][0][1]}`;
	    }
	bars[i].style.opacity = .33333;
	}
    // add the x Axis
    var xAxis = d3.axisBottom(x)
    .tickValues("");
  svg.append("g")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);
	

	// add the y Axis
	let yAxis = d3.axisLeft(y).tickValues("");
  svg.append("g")
      .call(yAxis);



	
    } 

}



// function histo () {

//     let idataSrc = ctx.getImageData(0,0, c.width, c.height),
// 	idataTrg = ctx.createImageData(c.width, c.height);
//     let dataSrc = idataSrc.data;
//     let pixelSet = [];
//     let len = dataSrc.length;
//     for (let i = 0;i < len; i += 4) {
// 	let groupedPixelData = [dataSrc[i], dataSrc[i+1], dataSrc[i+2]];
// 	pixelSet.push(groupedPixelData);
//     }
//     let colorSet = [...pixelSet.map(color => color.toString())];
//     // console.log(colorSet);
//     // colorSet.sort(function(a, b) {return +a[maxRangeInitial] - +b[maxRangeInitial];});
//     let counts = [];
//     let holder = [];
//     for (let i = 0; i < colorSet.length; i++) {
//     	if(holder.indexOf(colorSet[i]) === -1) {
//     	    holder.push(colorSet[i]);
//     	    counts[i] += 1;
	    
//     	} else {
//     	    counts[holder.indexOf(colorSet[i])]+= 1;
//     	}
//     }
    
//     return counts;
    
// }






