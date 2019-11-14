var robot = require('./robotjs/robotjs');
var HID = require('node-hid');
var devices = HID.devices();

var deviceToLook = "controller";

var prevData = {};

mouseKey = {
    left: false,
    middle: false,
    right: false
}

robot.setMouseDelay(2);
var mouse = robot.getMousePos();
console.log("Mouse X:", mouse.x, ", Mouse Y:", mouse.y);

var usbControllerDevice = devices.filter(x => x.product.toLowerCase().indexOf(deviceToLook) >= 0)[0];
console.log("USBControllerDevice:", usbControllerDevice);
if (usbControllerDevice) {
    var usb = new HID.HID(usbControllerDevice.path);
    usb.on("data", (d) => {
        var newData = processBytes(d);

        moveMouseToDelta(newData.AXIS_LX, newData.AXIS_LY);
        scrollMouseToDelta(newData.AXIS_RX, newData.AXIS_RY);

        if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
            // console.clear();
            // console.table(newData);
            prevData = newData;

            //Move mouse according to the axis

            //console.table({dx,dy});

            if (newData.KEY_A) {
                if (!mouseKey.left) {
                    robot.mouseToggle("down");
                    mouseKey.left = true;
                }
            } else {
                if (mouseKey.left) {
                    robot.mouseToggle("up");
                    mouseKey.left = false;
                }
            }

            if (newData.KEY_B) {
                if (!mouseKey.right) {
                    robot.mouseToggle("down", "right");
                    mouseKey.right = true;
                }
            } else {
                if (mouseKey.right) {
                    robot.mouseToggle("up", "right");
                    mouseKey.right = false;
                }
            }

            if (newData.KEY_RR) {
                if (!mouseKey.middle) {
                    robot.mouseToggle("down", "middle");
                    mouseKey.middle = true;
                }
            } else {
                if (mouseKey.middle) {
                    robot.mouseToggle("up", "middle");
                    mouseKey.middle = false;
                }
            }
        }
        // console.log(d);
    });
    usb.on("error", (d) => {
        console.log("Error:", d);
    });
} else {
    console.log("No such device found in the system!");
}
function scrollMouseToDelta(deltaX, deltaY) {
    var dx = deltaX - 128;
    var dy = deltaY - 127;

    if (dx < -100) dx = -100;
    else if (dx > 100) dx = 100;

    if (dy < -100) dy = -100;
    else if (dy > 100) dy = 100;

    var scrollX = dx;
    var scrollY = dy;

    robot.scrollMouse(scrollX, scrollY);
}
function moveMouseToDelta(deltaX, deltaY) {
    var mouse = robot.getMousePos();
    var mouseX = mouse.x;
    var mouseY = mouse.y;

    var dx = deltaX - 128;
    var dy = deltaY - 127;

    if (dx < -100) dx = -100;
    else if (dx > 100) dx = 100;

    if (dy < -100) dy = -100;
    else if (dy > 100) dy = 100;

    mouseX += dx / 20;
    mouseY += dy / 20;

    robot.moveMouse(mouseX, mouseY);
}
function processBytes(bytes) {
    //14 length of bytes
    var c = {};
    c.KEY_A = !!(bytes[10] & 0x01);
    c.KEY_B = !!(bytes[10] & 0x02);
    c.KEY_X = !!(bytes[10] & 0x04);
    c.KEY_Y = !!(bytes[10] & 0x08);
    c.KEY_LB = !!(bytes[10] & 0x10);
    c.KEY_RB = !!(bytes[10] & 0x20);
    c.KEY_LL = !!(bytes[11] & 0x01);
    c.KEY_RR = !!(bytes[11] & 0x02);
    c.KEY_LT = (bytes[9] - 0x80) > 0 ? (bytes[9] - 0x80) : 0;
    c.KEY_RT = (0x80 - bytes[9]) > 0 ? (0x80 - bytes[9]) : 0;

    c.KEY_BACK = !!(bytes[10] & 0x40);
    c.KEY_PAUSE = !!(bytes[10] & 0x80);

    c.AXIS_LX = (bytes[1]);
    c.AXIS_LY = (bytes[3]);
    c.AXIS_RX = (bytes[5]);
    c.AXIS_RY = (bytes[7]);

    return c;
}

// var names = iohook.eventNames();