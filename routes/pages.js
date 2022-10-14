const express = require('express');
const SSE = require('express-sse');
const router = express.Router();
const fs = require('fs');
const utf8 = require('utf8');
const Buffer = require('buffer/').Buffer;


///////////////////////////////// sse setup //////////////////////////////////////
var sse = new SSE();
router.get('/stream', sse.init);
//////////////////////////////////////////////////////////////////////////////////
// Get parameter model
// const Parameter = require('../models/parameter');

const { SerialPort } = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter')

let msg_receive = {
    order: -1,
    value: -1
}
let prev_msg_receive = {
    order: -1,
    value: -1
};
//////////////////////////////////////////// serial port /////////////////////////////////////////////////

// const DelimiterParser = require('@serialport/parser-delimiter');
const { setInterval } = require('timers/promises');
const { json } = require('body-parser');
// SerialPort.list()
// .then (data => console.log(data))
let port;
let parser;

let Order = {
    HELLO: 0,
    ALREADY_CONNECTED: 1,
    ERROR: 2,
    RECEIVED: 3,
    TEMPERATURE: 4,
    PRESSURE: 5,
    TIME: 6,
    START: 7,
    STOP: 8,
    SHUTDOWN: 9,
    STARTED: 10,
    TEMPERATURE2: 11,
    HEATING: 12,
    ONSTATE: 13,
    STANDBY: 14,
    PING: 15
};

async function open_serialPort() {

    SerialPort.list()
        .then(function (ports) {
            console.log(ports)
            ports.forEach(function (port) {
                console.log("PORT NAME: " + port.path);
                // console.log("PORT ID: " + port.pnpId);
                // console.log("PORT MANUFACTURER: " + port.manufacturer);

                // let searchString = port.manufacturer;
                // let lookFor = "wch.cn";
                // let lookFor1 = "arduino";
                // let lookFor2 = "silicon laboratories";
                // searchString = searchString.toLowerCase();

            })
        })
        .then(function () {

            port = new SerialPort({
                path: '/dev/ttyS0',
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
            });
            parser = port.pipe(new DelimiterParser({ delimiter: '>' })) // Read the port data
            port.on("error", (err) => {
                connected_Arduino = false;
                setTimeout(() => {
                    open_serialPort();
                }, 1000)
                console.log(err);
            });
            port.on("close", () => {
                connected_Arduino = false;
                setTimeout(() => {
                    open_serialPort();
                }, 1000)
                console.log('port closed');
            });
            port.on("open", () => {
                console.log('serial port open');
                connecting_to_arduino();
            });
            parser.on('data', data => {
                // console.log('in parser.on')
                prev_msg_receive.order = msg_receive.order; // saving previous received order
                prev_msg_receive.value = msg_receive.value; // saving previous received value
                let seperator_index = data.toString().indexOf("<"); // order and value seperator from string
                if (seperator_index != -1) {
                    msg_receive.order = parseInt(data.toString().substring(0, seperator_index));
                    msg_receive.value = parseInt(data.toString().substring(seperator_index + 1, data.toString().length));
                }

                console.log('got word from arduino:', msg_receive);
                // console.log('got word from arduino:', data.toString());
                // console.log('Data:', data.toString('utf8'));
                if (connected_Arduino) {

                    if (msg_receive.order == Order.RECEIVED) {

                        console.log("Received Arduino acknowledgement");
                        if (msg_receive.order !== prev_msg_receive.order) { // means arduino some data to act on

                            let content = {
                                msg: "Response from Arduino",
                                action: true,
                                response: prev_msg_receive,
                            }
                            sse.send(content, 'data');

                        } else {

                            let content = {
                                msg: "Response from Arduino",
                                action: false,
                                response: prev_msg_receive,
                            }
                            sse.send(content, 'data');

                        }
                    } else if (msg_receive.order == Order.PING) {

                        port.write("0<0>", (err) => { // sending hello to make handshake connection again if lost
                            if (err) {
                                return console.log('Error on write: ', err.message);
                            }
                            console.log('Sending connection making request again!');
                        });
                    } else if (msg_receive.order == Order.HELLO || msg_receive.order == Order.ALREADY_CONNECTED) {

                        console.log("Connection build again!");
                        let content = {
                            msg: "connected",
                            action: false,
                            response: '',
                        }
                        sse.send(content, 'data');

                    }

                } else { // sending handshaking request to arduino

                    if (msg_receive.order == Order.HELLO || msg_receive.order == Order.ALREADY_CONNECTED) {
                        console.log("Handshake accepted!");
                        connected_Arduino = true;
                        let content = {
                            msg: "connected",
                            action: false,
                            response: '',
                        }
                        sse.send(content, 'data');
                    } else {
                        console.log("Not getting arduino response..."); // means connection not established
                        connecting_to_arduino(); // sending handshake request again
                    }

                }
            });
        });
}

let connected_Arduino = false;

// const buf = Buffer.from('6<600>', 'utf8');
// console.log(buf);

function connecting_to_arduino() {

    let test1 = "0<0>";
    port.write(test1, (err) => { // sending hello to make handshake connection
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('message written');
    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Get / (Home page)
 */
router.get('/', async (req, res) => {


    if (!connected_Arduino) {
        await open_serialPort();
        console.log('open serial port')
    }

    fs.readFile('parameters.txt', (err, data) => {
        if (err) console.log(err);
        let data1 = JSON.parse(data);
        console.log(data1)
        res.render('index1.ejs', {
            parameters: {
                temperature: data1.temperature,
                druck: data1.druck,
                bezugszeit: data1.bezugszeit,
                standBy: data1.standBy,
            }
        });
    });
});

/*
 * post 
 */
router.post('/send', async (req, res) => {

    let sendText = req.body.sendText;
    console.log('req.body.sendText: ' + sendText);
    if (connected_Arduino) {
        port.write(sendText, async (err) => {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('message written');
            console.log("sending response");

            if (req.body.parametersUpdate) {

                let parameters = req.body.parameters;
                let obj = {
                    temperature: parseFloat(parameters.temperature),
                    druck: parseFloat(parameters.druck),
                    bezugszeit: parseFloat(parameters.bezugszeit),
                    standBy: parseFloat(parameters.standBy),
                }

                fs.writeFile('parameters.txt', JSON.stringify(obj), function (err) {
                    if (err) console.log(err);
                    console.log('Parameters Written!');
                    res.send("Success!");
                });

            } else {
                res.send("Success!");
            }
        });
    } else {
        if (req.body.parametersUpdate) {

            let parameters = req.body.parameters;
            let obj = {
                temperature: parseFloat(parameters.temperature),
                druck: parseFloat(parameters.druck),
                bezugszeit: parseFloat(parameters.bezugszeit),
                standBy: parseFloat(parameters.standBy),
            }

            fs.writeFile('parameters.txt', JSON.stringify(obj), function (err) {
                if (err) console.log(err);
                console.log('Parameters Written!');
                res.send("Success!");
            });

        } else {
            res.send("Success!");
        }
    }

});

/*
 * Get /test
 */
// router.get('/test', (req, res) => {

//     res.render('test.ejs')
// });

// /*
//  * post /test
//  */
// router.post('/test', (req, res) => {

//     let value = req.body.onState; 
//     prev_msg_receive = {
//         order: Order.ONSTATE,
//         value: value
//     }
//     let content = {
//         msg: "Response from Arduino",
//         action: true,
//         response: prev_msg_receive,
//     }
//     sse.send(content, 'data');
//     res.send({ msg: 'success' })

// });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//export
module.exports = router;