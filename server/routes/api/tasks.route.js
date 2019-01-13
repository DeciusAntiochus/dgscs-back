var express = require('express');
var router = express.Router(); 
const auth = require('../auth-payload');

var TasksController = require('../../../controllers/tasks/tasks.controller');
var FileController = require('../../../controllers/files/files.controller');
var ChattaskController = require('../../../controllers/tasks/chattask.controller')


router.post('/createtask', auth, TasksController.create); // ok ?

router.get('/gettasks/:userID', TasksController.getTasksFromUser);
router.post('/gettask/:userID', TasksController.getTaskFromUser);

router.put('/edittaskstatus/:userID', TasksController.editStatus);
router.put('/edittask/:userID', TasksController.editTask);

router.post('/file/:taskID', FileController.uploadTaskFile);


router.post('/savechat', ChattaskController.save);
router.get('/getchat/:id',ChattaskController.getChat)

router.put('/deletelinktask', TasksController.deleteLinkTask)

router.put('/addlinktask', TasksController.addLinkTask)

router.get('/getwp/:id', TasksController.getWP)


module.exports = router;