class car {
	constructor(id, lane=int(random(0, AMTLANES)), agressive=int(random(1, 6)), targetSpeed=random(1, 2)) {
		// Cars often get stuck when transitioning from start to end early in the simulation
		// Conditions for lanechange have to bet met for a continous time period before the switch happens
		this.id = id;
		this.agressive = agressive;

		this.lane = lane;
		// also relate average speed to targetSpeed - circumventing full left lane
		// this.targetSpeed = targetSpeed || random(1.90, 2);
		this.targetSpeed = targetSpeed;

		this.speedMargin = map(this.agressive, 1, 5, this.targetSpeed * (20/100), this.targetSpeed * (2/100));

		this.timeMargin = map(this.agressive, 1, 5, 2, 0.5);
		this.cooldown = map(this.agressive, 1, 5, 5, 1)


		// Full stop in x seconds (timeMargin - 0.1) - should never crash
		// Use timeMargin??
		this.acceleration = this.targetSpeed / (60 * (this.timeMargin - 0.1));
		// this.acceleration = this.targetSpeed / (60 * 1);
		// this.timeMargin = 1;
		// this.cooldown = 2;

		// Amount of time since the car crashed
		this.collisionTime = 0;
		// Amount of frames since lane change
		this.framesSinceLC = 0;
		// Current speed
		this.speed = 0;
		// speed as percentage of targetSpeed
		this.efficiency = 0;
		// Whether the car is on - turns off in a crash
		this.on = true;
		// Whether the car sped up the last frame
		this.accelerating = false;

		this.size = createVector(CARSIZE[0], CARSIZE[1]);
		// Logic y
		this.y = random(this.size.y, TOTALHEIGHT - this.size.y);
	}

	render() {
		// Draws car in color based on speed
		if (this.targetSpeed != 0) {
			this.efficiency = this.speed / this.targetSpeed;
		} else {
			this.efficiency = 1
		}
		// Color based on speed
		let c;
		if (this.speed < this.targetSpeed - this.speedMargin - 0.1) {
			c = color(255, 0, 0);
		} else {
			c = color(0, 255, 0);
		}
		if (!this.on) {
			c = color(100);
		}

		// Position
		// this.y = 0 corresponds to screenY of - this.size.y
		this.screenY = (this.y) % ROADTRUEHEIGHT - this.size.y;
		let roadNum = (Math.floor((this.y) / ROADTRUEHEIGHT));
		this.screenX = (roadNum * ROADWIDTH) + (LANEWIDTH * this.lane) + (ROADDIST * 3 / 2);

		fill(c);
		// console.log(screenX, screenY)
		rect(this.screenX, this.screenY, this.size.x, this.size.y);

		fill(255);
		if (this.carInLane("f") !== false) {
			// text(int(this.carDist(this.carInLane("f"), "f")), this.screenX, this.screenY);
			// text(int(this.carDist(this.carInLane("b"), "b")), this.screenX, this.screenY + this.size.y + 10);


			// text(int(this.colliding(this.carInLane("f"))), screenX, screenY);
		}
		// text(int(this.y), this.screenX, this.screenY)
		// text(this.id, this.screenX + 3, this.screenY + this.size.y / 2);
	}

	drive() {
		// Overhead logic for car
		if (this.on) {
			// rebound when off screen
			this.offscreen();

			// Collision
			if (this.colliding()) {
				this.on = false;
				this.speed = 0;
				// console.log("Crash: " + this.id)
			}

			this.adjustSpeed();
			this.laneChange();
			this.y -= this.speed - SCROLLSPEED;
		} else {
			this.collisionTime += 1;
			if (this.collisionTime >= fr * 20 || !this.colliding()) {
				// If a two cars crash one will be removed before the other
				// Delete this car
				delCar(this.id)
			}
		}
	}

	offscreen() {
		// rebound when off screen
		if (this.y >= TOTALHEIGHT) {
			this.y = 1;
		} else if (this.y < 0) {
			this.y = TOTALHEIGHT - 1;
		}
	}

	carInLane(dir) {
		// Returns the car directly (f)orwards or (b)ackwards from current car
		let closest = [Math.pow(10, 6), -1];
		let distance;
		for (let i = 0; i < cars.length; i++) {
			if (this.lane == cars[i].lane) {
				if (this.id != cars[i].id) {
					distance = this.carDist(i, dir);
					if (distance < closest[0]) {
						closest = [distance, i];
					}
				}
			}
		}
		if (closest[1] == -1) {
			return false;
		} else {
			return closest[1];
		}
	}

	carDist(index, dir) {
		// Returns distance to car in lane (f)orwards or (b)ackwards
		let distance;
		if (dir == "f") {
			if (this.y >= cars[index].y) {
				// They are infront of me
				distance = this.y - cars[index].y - this.size.y;
			} else {
				// They are behind me
				// + My distance to top
				// + Their distance to bottom (TOTALHEIGHT - their y)
				// - Their size.y
				distance = TOTALHEIGHT + this.y - cars[index].y - cars[index].size.y;
			}
		} else if (dir == "b") {
			if (cars[index].y >= this.y) {
				// I am infront of them
				distance = cars[index].y - this.y - this.size.y;
			} else {
				// I am behind them
				distance = TOTALHEIGHT + cars[index].y - this.y - cars[index].size.y;
			}
		} else {
			throw "Invalid input to carDist: " + dir + ", caller: " + arguments.callee.caller;
		}
		return distance;
	}

	colliding() {
		// Iterates over all cars and checks if distance forwards or backwards
		// is less than 0
		for (let i = 0; i < cars.length; i++) {
			if (this.lane == cars[i].lane) {
				if (this.id != cars[i].id) {
					if (this.carDist(i, "f") < 0 || this.carDist(i, "b") < 0) {
						return true;
					}
				}
			}
		}
		return false;
	}

	spaceInLane(dir) {
		// Returns boolean based on whether there is space in the lane given
		// (+1 / -1)
		// Creates a dummy car in applicable lane, and checks the space required
		// by the current car based on timeMargin

		let tmpCar = new car(-1);
		tmpCar.lane = this.lane + dir;
		let travXSeconds = this.speed * fr * this.timeMargin;

		let b = this.y - travXSeconds;
		let t = this.y + travXSeconds;

		for (let pos = b; pos <= t + tmpCar.size.y; pos += tmpCar.size.y - 1) {
			let carPos = pos;
			if (carPos < 0) {
				carPos += TOTALHEIGHT;
			} else if (carPos >= TOTALHEIGHT) {
				carPos -= TOTALHEIGHT;
			}
			tmpCar.y = carPos
			if (tmpCar.colliding()) {
				return false;
			}
		}
		return true;
	}

	adjustSpeed() {
		// Adjusts the speed of current car based on space infront
		let infrontIndex = this.carInLane("f");
		let newSpeed;
		if (infrontIndex !== false) {
			// (fr = 60)
			// dist / (speed * 60) = timeMargin
			// dist = timeMargin * speed * 60
			// dist / (timeMargin * 60) = speed
			newSpeed = this.carDist(infrontIndex, "f") / (this.timeMargin * fr);
			newSpeed = Math.min(this.targetSpeed, newSpeed);
			newSpeed = Math.max(0, newSpeed);
		} else {
			newSpeed = this.targetSpeed;
		}
		let speedDiff = newSpeed - this.speed;
		if (abs(speedDiff) > this.acceleration) {
			this.speed += Math.sign(speedDiff) * this.acceleration;
			this.accelerating = true;
		} else {
			this.speed += speedDiff;
			this.accelerating = false;
		}
	}

	laneChange() {
		// Logic:
		// If moving slow -> switch left
		// Not moving slow -> switch right
		//
		// Restrictions:
		// time since lanechange
		// spaceInLane
		let wantFasterLane = this.speed < this.targetSpeed - this.speedMargin
		let waitInLane;
		let infrontIndex = this.carInLane("f");
		if (infrontIndex !== false) {
			waitInLane = cars[infrontIndex].accelerating && cars[infrontIndex].targetSpeed > this.targetSpeed;
		} else {
			waitInLane = false;
		}
		this.framesSinceLC += 1;
		if (!wantFasterLane && this.framesSinceLC / fr >= this.cooldown && this.spaceInLane(1) && this.lane != AMTLANES - 1) {
			// Move right to a slower lane
			this.lane += 1;
			this.framesSinceLC = 0;
		}
		if (!waitInLane && wantFasterLane && this.framesSinceLC / fr >= this.cooldown && this.spaceInLane(-1) && this.lane != 0) {
		// Move left to a faster lane
		// If there is a car in the right lane moving slower than desired?
			this.lane -= 1;
			this.framesSinceLC = 0;
		}
	}
}
















// ALTERNATIVE OLDER VERSION OF laneChange

/*
this.laneChange = function() {
	// Current version
	// Drivers too passive
	// Clogged right lanes, only those with a high enough targetSpeed will pass
	// If the lane has completely stopped
	this.framesSinceLC += 1;

	var infrontIndex = this.carInLane("f");
	if (infrontIndex !== false) {
		var wantFasterLane = this.targetSpeed > cars[infrontIndex].targetSpeed && this.speed < this.targetSpeed - this.speedMargin;
	} else {
		var wantFasterLane = false;
	}

	// console.log("ok")
	if (!wantFasterLane && this.framesSinceLC / fr >= this.cooldown && this.spaceInLane(1) && this.lane != amtLanes - 1) {
		// Move right to a slower lane
		this.lane += 1;
		var tmpSpeed = this.speed;
		this.adjustSpeed();
		if (this.speed < this.targetSpeed - this.speedMargin) {
			this.lane -= 1;
		} else {
			this.framesSinceLC = 0;
		}
		this.speed = tmpSpeed;
	}
	if (infrontIndex !== false) {
		if (wantFasterLane && this.framesSinceLC / fr >= this.cooldown && this.spaceInLane(-1) && this.lane != 0) {
		// Move left to a faster lane
			this.lane -= 1;
			var tmpSpeed = this.speed;
			this.adjustSpeed();
			if (this.speed < this.targetSpeed - this.speedMargin) {
				this.lane += 1;
			} else {
				this.framesSinceLC = 0;
			}
			this.speed = tmpSpeed;
		}
	}
}
*/
