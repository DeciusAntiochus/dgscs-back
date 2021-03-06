const multer = require('multer')
const mkdirp = require('mkdirp')
const fs = require('fs');
const util = require('util');

const globals = require('../../config/globals')

const WorkPackageModel = require('../../models/workpackage');
const FileModel = require('../../models/file');
const TaskModel = require('../../models/task');
const UserModel = require('../../models/user');
const ReportModel = require('../../models/report')

const store = multer.diskStorage({
  destination: function (req, file, cb) {
    mkdirp('./static/assets/files/', function (err) {
      if (err) console.log("Unable to create folder.")
      cb(null, './static/assets/files');
    })

  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage: store }).single('file');

const uploadFile = async function(req, res, err){
  try{

    // 1. On upload le fichier
    const upload2 = util.promisify(upload); //upload nécessite des callback donc on le transforme en promise
    await upload2(req, res);

    // 2. On vérifie qu'il y a bien un auteur
    if (!req.body.author) {
      throw new Error("Il manque l'attribut 'author'");
    }

    // 3. Création de l'objet File dans la BDD

    let file = new FileModel({
      name : req.body.name ? req.body.name : req.file.originalname,
      originalName : req.file.originalname,
      author : req.body.author,
      description : req.body.description ? req.body.description : null,
      fileURL  : req.file.filename,
      date : new Date()
    });

    await file.save()
    file = await FileModel.findById(file._id).populate({path : "author", select : ["first_name", "last_name"]});

    // 4. On va ajouter ce file dans la liste des files du user;

    await UserModel.findOneAndUpdate({_id: req.body.author}, {$push: {files: file._id}});

    return file

  }
  catch(e){

    console.log(e.message);
    // S'il y a un problème, on supprime le fichier de la BDD

    fs.unlink('./static/assets/files/' + req.file.filename, function (err) {
      if (err) return console.log(err);
      console.log('File deleted successfully');
    });

    throw e

  }
}



exports.uploadTaskFile = async function(req, res, err) {
  try{
    file = await uploadFile(req, res, err);

    // 4. On enregistre le fichier dans la tâche

    const newTask = await TaskModel.findOneAndUpdate({_id: req.params.taskID}, {$push: {files: file._id}}, { new: true });
    return res.status(200).json({ file : file, task : newTask });
  } 
  catch(e){
    return res.status(500).json({ error : e.message });
  }
}

exports.uploadWorkPackageFile = async function(req, res, err) {
  try{

    file = await uploadFile(req, res, err);

    // 4. On enregistre le fichier dans le WP

    await WorkPackageModel.findOneAndUpdate({_id: req.params.workpackageID}, {$push: {files: file._id}});
    return res.status(200).json({ file : file });
  } 
  catch(e){
    return res.status(500).json({ error : e.message });
  }
}

exports.uploadReportFile = async function(req, res,err){

  try {

    file = await uploadFile(req,res, err);

    //4. On enregistre le fichier dans la table compte-rendus

    const db_file = new ReportModel({file: file._id});

    db_file.save();

    return res.status(200).json({file: file});

  }

  catch(e){

    return res.status(500).json({error: e.message })

  }

}

exports.get3LastReports = async function(req, res, err){

  try {

    ReportModel.find().sort({date: -1}).limit(3).populate({path : 'file', populate : { path : 'author', select : ['first_name', 'last_name']}}).exec(function(err,reports){

      return res.status(200).json(reports);

    })

  }
  catch(e) {
    return res.status(500).json({error : e.message});
  }

}


exports.getReports = async function(req, res, err){

  try {

    ReportModel.find().populate({path : 'file', populate : { path : 'author', select : ['first_name', 'last_name']}}).exec(function(err,reports){

      return res.status(200).json(reports);

    })

  }
  catch(e) {
    return res.status(500).json({error : e.message});
  }

}


exports.getFile = async function (req, res, err) {
  const fileURL = decodeURIComponent(req.params.fileURL);
  try {
    const file = await FileModel.findOne({ fileURL : fileURL });
    res.status(200).sendFile(file.fileURL, {root: './static/assets/files/'});
  }
  catch(e) {
    return res.status(500).json({error : e.message, file : file});
  }
}


exports.uploadWPFile = async function (req, res, err) {


  upload(req, res, function (err) {


    WorkPackageModel.findById(req.params.id, function (err, wp) {

      if (err) res.status(500).send(err);

      wp.files.push(globals.api + req.file.path)

      try {
        wp.save();
      }

      catch (e) {
        res.status(500).send(err);
      }


    })

    if (err) console.log(err);

    res.status(200).json("ok")

  })


}

