class car {
	constructor(id, lane=int(random(0, AMTLANES)), timeMargin=3, speedMargin=3, targetSpeed=random(1, 2)) {
		// Conditions for lanechange have to bet met for a continous time period before the switch happens
		this.id = id;

		this.lane = lane;
		// also relate average speed to targetSpeed - circumventing full left lane
		// this.targetSpeed = targetSpeed || random(1.90, 2);
		this.targetSpeed = targetSpeed;

		this.timeMargin = timeMargin;
		this.speedMargin = speedMargin;

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
		for (let i = 0; i < drivers.length; i++) {
			if (this.lane == drivers[i].lane) {
				if (this.id != drivers[i].id) {
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
			if (this.y >= drivers[index].y) {
				// They are infront of me
				distance = this.y - drivers[index].y - this.size.y;
			} else {
				// They are behind me
				// + My distance to top
				// + Their distance to bottom (TOTALHEIGHT - their y)
				// - Their size.y
				distance = TOTALHEIGHT + this.y - drivers[index].y - drivers[index].size.y;
			}
		} else if (dir == "b") {
			if (drivers[index].y >= this.y) {
				// I am infront of them
				distance = drivers[index].y - this.y - this.size.y;
			} else {
				// I am behind them
				distance = TOTALHEIGHT + drivers[index].y - this.y - drivers[index].size.y;
			}
		} else {
			throw "Invalid input to carDist: " + dir + ", caller: " + arguments.callee.caller;
		}
		return distance;
	}

	colliding() {
		// Iterates over all cars and checks if distance forwards or backwards
		// is less than 0
		for (let i = 0; i < drivers.length; i++) {
			if (this.lane == drivers[i].lane) {
				if (this.id != drivers[i].id) {
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
				delDriver(this.id)
			}
		}
	}
}
