// Import du modèle sauce
const Sauce = require('../models/sauce');

// Import de cloudinary configuré
const cloudinary = require('../utils/cloudinary');

// Import de la fonction removeImageFile
const functions = require('../utils/functions');

// Enregistrement d'une nouvelle sauce
exports.createSauce = (req,res) => {
    const sauceObject = JSON.parse(req.body.sauce); // Conversion du corps de la requête en objet json
    delete sauceObject._id;     //  Suppression de l'id renvoyé par le frontend

    if (sauceObject.userId == req.token.userId) { // Test si l'userId de la requête correspond au token d'authentification
      cloudinary.uploader             // Upload du fichier image de la requête sur cloudinary
        .upload(req.file.path , {folder: "hottakes"})
        .then(result => 
            {const sauce = new Sauce({
            ...sauceObject,         // Copie tous les éléments de l'objet json dans la nouvelle instance
            imageUrl: result.secure_url,    // Récupère l'url de l'image renvoyé par cloudinary
            cloudinary_id: result.public_id // Récupère l'id de l'image renvoyé par cloudinary
            });
            sauce.save()    // Enregistrement de la nouvelle sauce dans la base de données
              .then(() => res.status(201).json({ message: 'Sauce saved'}))    // Création de ressource
              .catch(error => res.status(400).json({ error }));}               // Mauvaise requête
        )
        .catch(error => console.log(error))
    } else {
      res.status(403).json({ error: "Unauthorized request" });
    }
}
      
// Récupération de toutes les sauces
exports.getAllSauces = (req, res) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))         // Requête ok
      .catch(error => res.status(400).json({ error }));     // Mauvaise requête
};

// Récupération d'une sauce
exports.getOneSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))         // Requête ok
      .catch(error => res.status(404).json({ error }));   // Ressource non trouvée
};

// Modification d'une sauce
exports.modifySauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })                 // Recherche de la sauce avec l'id
      .then (sauce => {
        if (sauce.userId == req.token.userId) {           // Test si le userId du token correspond à celui de la sauce à modifier
          if (req.file) {                                 // Test si présence d'un fichier dans la requête
            cloudinary.uploader
            .destroy(sauce.cloudinary_id)                 // Suppression de l'ancienne image sur cloudinary
            .then(result => {
                cloudinary.uploader
                  .upload(req.file.path , {folder: "hottakes"})                  // Upload de la nouvelle image sur cloudinary
                  .then(result => {
                      const sauceObject = {                                 // Création du nouvel objet sauce
                        ...JSON.parse(req.body.sauce),                      // Conversion du corps de la requête en objet json
                        imageUrl: result.secure_url,                         // Mise à jour de l'url de la nouvelle image
                        cloudinary_id: result.public_id                     // Mise à jour de l'id cloudinary
                      }
                      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })   // Mise à jour des modifications dans mongodb
                        .then(() => res.status(200).json({ message: 'Sauce modified'})) // Requête ok
                        .catch(error => res.status(400).json({ error }));               // Mauvaise requête
                  })
                  .catch(error => console.log(error));                
            })
            .catch(error => console.log(error));
          } else {                                                                          // Si pas de fichier dans la requête
            Sauce.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })    // Remplacement par le corps de la requête
              .then(() => res.status(200).json({ message: 'Sauce modified'})) // Requête ok
              .catch(error => res.status(400).json({ error }));               // Mauvaise requête
          }
        } else {
            res.status(403).json({ error: "Unauthorized request" });    // Requête non autorisée
        }
      })
      .catch(error => res.status(404).json({ error }));   // Ressource non trouvée
}

// Suppression du sauce
exports.deleteSauce = (req, res) => {
  Sauce.findOne({_id: req.params.id})                   // Recherche de la sauce avec l'id
    .then (sauce => {
      if (sauce.userId == req.token.userId) {           // Test si le userId du token correspond à celui de la sauce à modifier
        cloudinary.uploader
          .destroy(sauce.cloudinary_id)                 // Suppression de l'ancienne image sur cloudinary
          .then(result => {
              Sauce.deleteOne({_id: req.params.id})                 // Suppression de la sauce
                .then(() => res.status(200).json({ message : "Sauce deleted"})) // Requête ok
                .catch(error => res.status(400).json({error}));                 // Mauvaise requête
          })
          .catch(error => console.log(error));          
      } else {
        res.status(403).json({ error: "Unauthorized request" });
      }})
    .catch(error => res.status(404).json({ error }));   // Ressource non trouvée
}