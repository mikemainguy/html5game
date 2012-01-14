var game = function(id) {

    var that = {};
    var me = {};
    me.startDate = new Date();
    me.count = 0;
    me.clock = 10;
    me.canvas = document.getElementById(id);

    me.canvas.setAttribute('width', me.canvas.clientWidth);
    me.canvas.setAttribute('height', me.canvas.clientHeight);

    me.degreeFactor = Math.PI / 180;
    me.tweens = [];

    that.context = me.canvas.getContext('2d');
    that.entities = [];

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

        if (!data.drawType) {
            data.drawType = 'rect';
        }
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
        data.destination = {};
        data.destination.unfinished = function() {
            var dest = data.destination;
            return (dest.x && !dest.x.done) ||
                    (dest.y && !dest.y.done) ||
                    (dest.rotation && !dest.rotation.done)
        }
        data.move = function(x, y) {
            data.direction = {x:x,y:y};
            me.tweens.push(data);
        }

        data.move_to = function(x, y, speed) {
            data.destination.x = me.interpolator(data.x, x, speed);
            data.destination.y = me.interpolator(data.y, y, speed);
            me.tweens.push(data);
        }

        data.rotate_to = function(new_angle, speed) {
            data.destination.rotation = me.interpolator(data.rotation, new_angle, speed);
            me.tweens.push(data);
        }

        that.entities.push(data);
        return data;
    }


    me.interpolator = function(start, finish, duration) {
        var inter = {};
        inter.done = false;
        var currentValue = start;
        var endValue = finish;
        var totalTicks = ((duration * 1000) / me.clock);
        var increment = (finish - start) / totalTicks;
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

    that.animate = function() {
        var newTweens = [];
        for (var i in me.tweens) {
            var e = me.tweens[i];
            if (e.direction) {
                e.x = me.wrap(e.x + e.direction.x || 0, me.canvas.width);
                e.y = me.wrap(e.y + e.direction.y || 0, me.canvas.height);
            }

            if (e.destination) {
                if (!e.destination.x.done) {
                    e.x = me.wrap(e.destination.x.pop());

                }
                if (!e.destination.y.done) {
                    e.y = me.wrap(e.destination.y.pop());
                }
                if (e.destination.rotation) {
                    e.rotation = e.destination.rotation.pop();
                }

            }
            if (e.direction || e.destination.unfinished()) {
                newTweens.push(e);
            }


        }
        me.tweens = newTweens;
        that.draw();
    }

    me.wrap = function(val, max) {
        if (val < 0) {
            return max;
        }
        if (val > max) {
            return 0;
        }
        return val;
    }

    me.debug = function() {
        var time = new Date();
        that.context.fillStyle = "#000000";
        var line = 20;
        that.context.fillText(1000 / ((time - me.startDate) / me.count) + ' fps', 20, line);
        that.context.fillText(me.count + ' frames ', 20, line + 15);
        that.context.fillText(that.entities.length + ' entities ', 20, line + 30);

        that.context.fillText(me.tweens.length + ' tweens ', 20, line + 45);
        var total = 0.0;
        for (var i in me.tweens) {
            total += me.tweens[i].destination.x.length();
            total += me.tweens[i].destination.y.length();
            total += me.tweens[i].destination.rotation.length();

        }
        that.context.fillText(total + ' tween details ', 20, line + 60);


    }


    setInterval(function() {
        that.animate();
    }, me.clock);

    return that;

}