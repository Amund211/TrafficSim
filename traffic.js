var cars = [];
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

function delCar(index) {
	cars.splice(index, 1);
	for (var car = 0; car < cars.length; car++) {
		cars[car].id = car
	}
}

function setup() {
	createCanvas(CANVASWIDTH, CANVASHEIGHT);
	// effT = createInput("wow");
	// totEffT = createInput();
	fr = int(frameRate());

	createCars:
		for (var i = 0; i < AMTCARS; i++) {
			// Creating a new car
			cars.push(new car(i));
			// Checking for collision
			var lastIndex = cars.length - 1;
			var attempts = 0;
			while (cars[lastIndex].colliding()) {
				// While colliding move "upwards" until not colliding, then settle
				// Or having been all the way around, then delete
				cars[lastIndex].y += 10;
				// Rebound when offscreen
				cars[lastIndex].offscreen();
				attempts += 1;
				if (attempts > TOTALHEIGHT/10) {
					cars.splice(lastIndex, 1);
					// break createCars;
					break
				}
			}
		}
	console.log("Created " + cars.length + " cars on length " + TOTALHEIGHT + " canvas.");
	// Having some issues with variable framerate
	// fr = int(frameRate());
	fr = 60;
	// Simulating driving
	for (var itr = 0; itr < SIMULATIONFRAMES; itr++) {
		for (var i = 0; i < cars.length; i++) {
			cars[i].drive();
		}
	}
	console.log("Simulated for " + SIMULATIONFRAMES + " frames")
}

function draw() {
	// fr = int(frameRate());
	fr = 60;
	// Driving
	for (var itr = 0; itr < ANIMATIONSPEED; itr++) {
		for (var i = 0; i < cars.length; i++) {
			cars[i].drive();
		}
	}

	efficiency = 0

	// Rendering and data gathering
	background(0);
	for (var i = 0; i < cars.length; i++) {
		cars[i].render();
		efficiency += cars[i].efficiency
	}

	// Efficiency calc
	// To percent as average
	efficiency /= cars.length / 100

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
	for (var i = 0; i < cars.length; i++) {
		var d = dist(mouseX, mouseY, cars[i].screenX + cars[i].size.x/2, cars[i].screenY + cars[i].size.y/2);
		if (d < 20) {
			if (mouseButton == LEFT) {
				console.log(i);
				// console.log((cars[i].framesSinceLC / fr));
				// console.log(abs(cars[i].timeMargin - 6));
				// console.log("");
				// cars[i].targetSpeed = int(!cars[i].targetSpeed);
				cars[i].on = false;
				// cars[i].laneChange()
			} else if (mouseButton == RIGHT) {
				delCar(i);
			}
		}
	}
}
