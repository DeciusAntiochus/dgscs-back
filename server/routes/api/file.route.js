var express = require('express');
var router = express.Router();
const auth = require('../auth-payload');

var FileController = require('../../../controllers/files/files.controller');
var UserController = require('../../../controllers/users/users.controller');


router.get('/:fileURL', FileController.getFile);

module.exports = router;