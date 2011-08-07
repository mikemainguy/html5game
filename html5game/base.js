var game = function(id) {

    var that = {};
    var me = {};
    me.startDate = new Date();
    me.count = 0;
    me.clock = 5;
    me.canvas = document.getElementById(id);
    me.canvas.setAttribute('width', me.canvas.clientWidth);
    me.canvas.setAttribute('height', me.canvas.clientHeight);
    me.degreeFactor = 3.14 / 180;

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
        me.debug();


        that.context.restore();
        that.context.font = "bold 12px sans-serif";
    }


    that.entity = function(data) {
        if (!data.destination) {
            data.destination = {};
        }

        data.move = function(x, y) {
            data.direction = {x:x,y:y};
        }

        data.move_to = function(x, y, speed) {
            data.destination.x = me.interpolator(data.x, x, speed);
            data.destination.y = me.interpolator(data.y, y, speed);
        }

        data.rotate = function(new_angle, speed) {
            data.destination.rotation = me.interpolator(data.rotation, new_angle, speed);
        }

        that.entities.push(data);
        return data;
    }


    me.interpolator = function(start, finish, speed) {
        var data = new Array();
        var inter = {};
        var count = ((speed * 1000) / me.clock);
        var factor = (finish - start) / count;
        for (i = count; i > 0; i--) {
            data.push(start + (i * factor))
        }
        inter.pop = function() {
            if (data.length > 0) {
                return data.pop();
            } else {
                return finish;
            }
        }
        return inter;
    }

    that.draw = function() {
        that.clr();
        for (i in that.entities) {
            e = that.entities[i];

            that.context.fillStyle = e.fillStyle || '#000000';
            if (e.rotation) {
                that.context.save();
                that.context.translate(e.x + e.w * .5, e.y + e.h * .5);
                that.context.rotate(e.rotation * me.degreeFactor);
                that.context.fillRect(-e.w * .5, -e.h * .5, e.w, e.h);
                that.context.restore();
            } else {
                that.context.fillRect(e.x, e.y, e.w, e.h);
            }
        }
    }

    that.animate = function() {
        for (i in that.entities) {
            e = that.entities[i];
            if (e.direction) {
                e.x = me.wrap(e.x + e.direction.x || 0, me.canvas.width);
                e.y = me.wrap(e.y + e.direction.y || 0, me.canvas.height);
            }
            if (e.destination) {
                if (e.destination.x) {
                    e.x = me.wrap(e.destination.x.pop());
                    e.y = me.wrap(e.destination.y.pop());
                }
                if (e.destination.rotation) {
                    e.rotation = e.destination.rotation.pop();
                }

            }

        }
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
        that.context.fillText(1000 / ((time - me.startDate) / me.count) + ' fps', 20, 20);
        that.context.fillText(me.count + ' frames ', 20, 40);

    }


    setInterval(function() {
        that.animate();
    }, me.clock);

    return that;

}