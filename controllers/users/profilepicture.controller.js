const UserModel = require('../../models/user')
const globals = require('../../config/globals')
const multer = require('multer');

const tokenID = require('./users.controller').tokenID;
const getStatus = require('./users.controller').getStatus;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './static/assets/img/avatars');
  },
  filename: function (req, file, cb) {
    cb(null, req.params.id + '.' + file.mimetype.split('/')[1]);
  }
});

const fileFilter = (req, file, cb) => {
  //rejeter un fichier
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  }
  else {
    cb(null, false);
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 512 * 512 * 5
  },
  fileFilter: fileFilter
});




exports.setPicture = async function (req, res, err) {



  const avatarUpload = upload.single('profilepicture');




  avatarUpload(req, res, function (err) {
    if (err) {
      return res.status(500).json("Erreur au cours de l'envoi de l'image. L'image ne doit pas excéder 512x512 px, et être au format jpeg ou png.");
    }

    UserModel.findByIdAndUpdate(req.params.id, { photoURL: globals.api + req.file.path }, function (err) {

      if (err) return res.status(500).send(err);

      return res.status(200).json("Profil bien modifié!");
    })
  });




}

exports.setPicture2 = async function (req, res) {
  try {

    const id = tokenID(req);

    // 1. On vérifie qu'il est bien 'actif' ou 'admin'
    try {
      const status = await getStatus(id);
      if (!((status == "active") || (status == "admin"))) {
        throw new Error("the user is not 'active' or 'admin'");
      }
    } catch (e) {
      return res.status(401).send({ error: e.message })
    }

    // 2. On uploader la photo de profil

    const avatarUpload = util.promisify(upload.single('profilepicture'));
    await avatarUpload(req, res);

    // 3. On enregistrer dans la BDD le l'url du fichier

    await UserModel.findByIdAndUpdate(id, { photoURL: globals.api + req.file.path });

    return res.status(200).json({ message: "Photo de profil bien modifiée " });

  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
}