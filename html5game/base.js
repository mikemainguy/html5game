Number.prototype.sign = function() {
    if (this > 0) {
        return 1;
    } else if (this < 0) {
        return -1;
    } else {
        return 0;
    }
}

Number.prototype.abs = function() {
    return Math.abs(this);
}

Number.prototype.wrapped = function(min, max) {
    if (this < min) {
        return max;
    }
    if (this > max) {
        return min;
    }
    return this;
}


Number.prototype.toward_zero = function(input) {
    var minus = (this.abs() - input);
    if (minus < 0) {
        return 0;
    } else {
        return this.sign() * minus;
    }

}


var game = function(id) {

    var that = {};
    var me = {};
    me.gravity = {x: 0, y: 0};
    me.startDate = new Date();
    me.count = 0;
    me.clock = 4;
    me.canvas = document.getElementById(id);

    me.canvas.setAttribute('width', me.canvas.clientWidth);
    me.canvas.setAttribute('height', me.canvas.clientHeight);

    me.degreeFactor = Math.PI / 180;
    me.animations = [];

    that.context = me.canvas.getContext('2d');
    that.entities = [];
    that.setGravity = function(input) {
        me.gravity.x = input.x || 0;
        me.gravity.y = input.y || 0;
    }
    that.clr = function() {
        that.context.save();
        // Use the identity matrix while clearing the canvas
        that.context.setTransform(1, 0, 0, 1, 0, 0);
        that.context.clearRect(0, 0, me.canvas.width, me.canvas.height);
        // Restore the transform
        //that.context.strokeStyle="#000";
        that.context.fillStyle = "#333333";
        me.count++;

        that.context.restore();
        that.context.font = "bold 12px sans-serif";
    }


    that.entity = function(data) {
        data.drawType = data.drawType || 'rect';
        data.decay = data.decay || 0;
        data.gravity_effect = data.gravity_effect || 0;

        if (data.path) {
            var min_x = 0;
            var min_y = 0;
            var max_x = 0;
            var max_y = 0;
            for (point in data.path) {
                if (min_x > point.x) {
                    min_x = point.x
                }
                if (max_x < point.x) {
                    max_x = point.x
                }
                if (min_y > point.y) {
                    min_y = point.y
                }
                if (max_y < point.y) {
                    max_y = point.y
                }
            }
            data.w = max_x - min_x;
            data.h = max_y - min_y;
            data.x = min_x;
            data.y = min_y;
        }

        data.moving = function() {
            return (data.direction || data.destination);
        }
        data.move = function(input) {
            if (!data.direction) {
                me.animations.push(data);
            }
            data.direction = input;

        }

        data.move_to = function(input) {
            data.destination = data.destination || {};
            data.destination.x = me.interpolator({start: data.x, finish: input.x, duration: input.duration});
            data.destination.y = me.interpolator({start: data.y, finish: input.y, duration: input.duration});
            me.animations.push(data);
        }

        data.rotate_to = function(input) {
            data.destination = data.destination || {};
            data.destination.rotation = me.interpolator({start: data.rotation, finish: input.angle, duration: input.duration});
            me.animations.push(data);
        }

        that.entities.push(data);
        return data;
    }


    me.interpolator = function(input) {
        var inter = {};
        inter.done = false;
        var currentValue = input.start;
        var endValue = input.finish;

        var totalTicks = ((input.duration * 1000) / me.clock);
        var increment = (endValue - currentValue) / totalTicks;
        inter.length = function() {
            return Math.abs(endValue - currentValue);
        }
        var currentTick = 0;
        inter.pop = function() {
            currentTick++;
            if (currentTick < totalTicks) {
                currentValue += increment;
            } else {
                inter.done = true;
            }
            return currentValue;
        }
        return inter;
    }

    that.draw = function() {
        that.clr();
        for (var i in that.entities) {
            var e = that.entities[i];

            e.x += (me.gravity.x * e.gravity_effect);
            e.y += (me.gravity.y * e.gravity_effect);

            that.context.fillStyle = e.fillStyle || '#000000';
            that.context.save();
            that.context.translate(e.x + e.w * .5, e.y + e.h * .5);
            that.context.rotate(e.rotation * me.degreeFactor);

            if (e.path) {
                that.context.beginPath();
                that.context.moveTo(e.path[0].x, e.path[0].y);
                for (var p = 1; p < e.path.length; p++) {
                    that.context.lineTo(e.path[p].x, e.path[p].y);
                }
                that.context.stroke();
                that.context.fill();
                that.context.closePath();
            } else {
                that.context.fillRect(-e.w * .5, -e.h * .5, e.w, e.h);
            }
            that.context.restore();

        }
        me.debug();

    }
    function unfinished(element) {
        var dest = element;
        return (dest.x && !dest.x.done) ||
                (dest.y && !dest.y.done) ||
                (dest.rotation && !dest.rotation.done)
    }

    that.animate = function() {

        var newTweens = [];
        for (var i in me.animations) {
            var e = me.animations[i];

            if (e.destination) {
                if (e.destination.x && !e.destination.x.done) {
                    e.x = e.destination.x.pop().wrapped(0,me.canvas.width);
                }
                if (e.destination.y && !e.destination.y.done) {
                    e.y = e.destination.y.pop().wrapped(0,me.canvas.height);
                }
                if (e.destination.rotation) {
                    e.rotation = e.destination.rotation.pop();
                }
                if (unfinished(e.destination)) {
                    newTweens.push(e);
                } else {
                    e.destination = null;
                }
            }

            if (e.direction) {
                e.x += e.direction.x;
                e.direction.x = e.direction.x.toward_zero(e.decay);
                e.y += e.direction.y;
                e.direction.y = e.direction.y.toward_zero(e.decay);
                if (e.direction.x.abs() > 0 || e.direction.y.abs() > 0) {
                    newTweens.push(e);
                } else {
                    e.direction = null;
                }
            }
        }
        me.animations = newTweens;
        that.draw();
    }


    me.debug = function() {
        var time = new Date();
        that.context.fillStyle = "#000000";
        var line = 20;
        that.context.fillText(1000 / ((time - me.startDate) / me.count) + ' fps', 20, line);
        that.context.fillText(me.count + ' frames ', 20, line + 15);
        that.context.fillText(that.entities.length + ' entities ', 20, line + 30);

        that.context.fillText(me.animations.length + 'animationss ', 20, line + 45);
        var total = 0.0;
        for (var i in me.animations) {
            if (me.animations[i]) {
                total += me.animations[i].destination.x.length();
                total += me.animations[i].destination.y.length();
                total += me.animations[i].destination.rotation.length();

            }

        }
        that.context.fillText(total + ' tween details ', 20, line + 60);


    }


    setInterval(function() {
        that.animate();
    }, me.clock);

    return that;

}