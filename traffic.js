var drivers = [];
var AMTLANES = 2;
var AMTCARS = 50;

// Logic iterations per frame of rendering
var ANIMATIONSPEED = 1;

// Speed at which the screen scrolls upward
// seen as the cars moving backwards
var SCROLLSPEED = 0;

// Amount of renderframes of logic the program runs before rendering
var SIMULATIONFRAMES = 1 * 60;

var CARSIZE = [20, 35];

// Amount of roads the length of road is split into
var AMTROADS = 5;

// Common distance between roads
var ROADDIST = 10;

// The height of one stretch of road on canvas
var ROADRENDERHEIGHT = 1895;

// The height of one stretch of road backend
var ROADTRUEHEIGHT = ROADRENDERHEIGHT + CARSIZE[1] - 1;

// The width of an individual lane of a road
var LANEWIDTH = 40;

// The length of the road that the cars move on logically
// Cars should only have a y value between 0 and this number
var TOTALHEIGHT = ROADTRUEHEIGHT * AMTROADS;
var ROADWIDTH = ROADDIST + LANEWIDTH * AMTLANES

// Total space used for the data display
var DATAWIDTH = 700;

// Width and height of the canvas element
var CANVASWIDTH = ROADWIDTH * AMTROADS + DATAWIDTH;
var CANVASHEIGHT = ROADRENDERHEIGHT;

// Measures the average percent of targetSpeed per car as a measurement for
// traffic flow
// Will vary with each sample beacuse of RNG, large samplesize desired
// May need some time to settle
var efficiency = 0;
var totalEfficiency = [0, 0];

var effT;
var totEffT;

var fr;

function delDriver(index) {
	drivers.splice(index, 1);
	for (var i = 0; i < drivers.length; i++) {
		drivers[i].id = i
	}
}

function setup() {
	createCanvas(CANVASWIDTH, CANVASHEIGHT);
	// effT = createInput("wow");
	// totEffT = createInput();
	fr = int(frameRate());

	createDrivers:
		for (var i = 0; i < AMTCARS; i++) {
			// Creating a new driver
			drivers.push(new human(i));
			// Checking for collision
			var lastIndex = drivers.length - 1;
			var attempts = 0;
			while (drivers[lastIndex].colliding()) {
				// While colliding move "upwards" until not colliding, then settle
				// Or having been all the way around, then delete
				drivers[lastIndex].y += 10;
				// Rebound when offscreen
				drivers[lastIndex].offscreen();
				attempts += 1;
				if (attempts > TOTALHEIGHT/10) {
					drivers.splice(lastIndex, 1);
					// break createDrivers;
					break
				}
			}
		}
	console.log("Created " + drivers.length + " drivers on length " + TOTALHEIGHT + " canvas.");
	// Having some issues with variable framerate
	// fr = int(frameRate());
	fr = 60;
	// Simulating driving
	for (var itr = 0; itr < SIMULATIONFRAMES; itr++) {
		for (var i = 0; i < drivers.length; i++) {
			drivers[i].drive();
		}
	}
	console.log("Simulated for " + SIMULATIONFRAMES + " frames")
}

function draw() {
	// fr = int(frameRate());
	fr = 60;
	// Driving
	for (var itr = 0; itr < ANIMATIONSPEED; itr++) {
		for (var i = 0; i < drivers.length; i++) {
			drivers[i].drive();
		}
	}

	efficiency = 0

	// Rendering and data gathering
	background(0);
	for (var i = 0; i < drivers.length; i++) {
		drivers[i].render();
		efficiency += drivers[i].efficiency
	}

	// Efficiency calc
	// To percent as average
	efficiency /= drivers.length / 100

	// Add to total average across entire runtime
	totalEfficiency[0] += efficiency
	totalEfficiency[1] += 1

	// Efficiency output
	push();
	fill(255);
	textSize(50);
	// effT.value("Current efficiency: " + int(efficiency) + "%");
	// totEffT.value("Average efficiency: " + int(totalEfficiency[0] / totalEfficiency[1]) + "%");
	text("Current efficiency: " + nf(efficiency, 2, 2) + "%", CANVASWIDTH - DATAWIDTH + 50, 100);
	text("Average efficiency: " + nf(totalEfficiency[0] / totalEfficiency[1], 2, 2) + "%", CANVASWIDTH - DATAWIDTH + 50, 200);
	pop();

	// Drawing dividers between roads
	fill(255);
	for (var i = 0; i <= AMTROADS; i++) {
		rect((i * ROADWIDTH) - 5, 0, ROADDIST, height)
	}
}

function mousePressed() {
	for (var i = 0; i < drivers.length; i++) {
		var d = dist(mouseX, mouseY, drivers[i].screenX + drivers[i].size.x/2, drivers[i].screenY + drivers[i].size.y/2);
		if (d < 20) {
			if (mouseButton == LEFT) {
				console.log(i);
				// console.log((drivers[i].framesSinceLC / fr));
				// console.log(abs(drivers[i].timeMargin - 6));
				// console.log("");
				// drivers[i].targetSpeed = int(!drivers[i].targetSpeed);
				drivers[i].on = false;
				// drivers[i].laneChange()
			} else if (mouseButton == RIGHT) {
				delDriver(i);
			}
		}
	}
}
