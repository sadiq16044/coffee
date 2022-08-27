const express = require('express');
const router = express.Router();

// Get parameter model
const Parameter = require('../models/parameter');

/*
 * Get / (Home page)
 */
router.get('/', (req, res) => {

    // Parameter.findOne({ sorting: 100 }, function (err, parameters) {
    //     if (err) console.log(err);

    //     res.render('index1.ejs', {
    //         parameters: parameters
    //     })
    // });
    res.render('index1.ejs', {
        parameters: {
            temperature: 88.5,
            druck: 8.9,
            bezugszeit: 20.1,
            standBy: 30,
        }
    })
});

/*
 * Get /parameter-values (Current Parameters)
 */
router.get('/parameter-values', (req, res) => {

    // Parameter.findOne({ sorting: 100 }, function (err, parameters) {
    //     if (err) console.log(err);

    //     res.send(parameters);
    // });
});

/*
 * post /update-parameters (Home page)
 */
router.post('/update-parameters', (req, res) => {

    // let temperature = parseFloat(req.body.temperature).toFixed(1);
    // let druck = parseFloat(req.body.druck).toFixed(1);
    // let bezugszeit = parseFloat(req.body.bezugszeit).toFixed(1);
    // let standBy = parseInt(req.body.standBy);

    // Parameter.findOne({ sorting: 100 }, function (err, parameters) {
    //     if (err) console.log(err);

    //     parameters.temperature = temperature;
    //     parameters.druck = druck;
    //     parameters.bezugszeit = bezugszeit;
    //     parameters.standBy = standBy;

    //     parameters.save(function (err) {
    //         if (err) console.log(err);

    //         res.send("Success!")
    //     });
    // });
    res.send("Success!")

});


//export
module.exports = router;