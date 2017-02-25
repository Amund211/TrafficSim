class human extends car {
	constructor(id, lane=int(random(0, AMTLANES)), agressive=int(random(1, 6)), targetSpeed=random(1, 2)) {
		let speedMargin = map(agressive, 1, 5, targetSpeed * (20/100), targetSpeed * (2/100));
		let timeMargin = map(agressive, 1, 5, 2, 0.5);
		super(
			id=id,
			lane=int(random(0, AMTLANES)),
			timeMargin=timeMargin,
			speedMargin=speedMargin,
			targetSpeed=targetSpeed);

		this.agressive = agressive;
		// Set in car constructor
		// this.speedMargin = speedMargin;
		// this.timeMargin = timeMargin;
		this.cooldown = map(this.agressive, 1, 5, 5, 1);


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
			waitInLane = drivers[infrontIndex].accelerating && drivers[infrontIndex].targetSpeed > this.targetSpeed;
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
		var wantFasterLane = this.targetSpeed > drivers[infrontIndex].targetSpeed && this.speed < this.targetSpeed - this.speedMargin;
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
