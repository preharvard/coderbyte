var express = require('express');
var router = express.Router();

var db = require('../models/db');
require('../models/bookmodel');
require('../models/usermodel');
var BookModel = db.model('Book');
var UserModel = db.model('User');

// 이미지 업로드 셋팅
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-1';
var s3 = new AWS.S3();

var upload = multer({
  storage: multerS3({
    s3 : s3,
    bucket : 'mocatest',
    acl : 'public-read',
    key : function(req, file, callback) {
      var tmp = file.mimetype.split('/')[1]; // file.mimetype
      if (tmp == 'jpeg') { tmp = 'jpg' }
      var ext = "." + tmp;
      var keyword = "Moca_Photo_";
      var newname = keyword + Date.now().toString() + ext;
      callback(null, newname);
    }
  })
});

// 3-11. Uploading a book(사진 업로드하기)
router.post('/', upload.single('img'), function(req, res, next) {
  var token_user_id = req.decoded.user_id;

  // imgSave function start
  var imgSave = function() {
    var book_img = req.file.location;
    var book_desc = req.body.book_desc;

    var data = new BookModel({
      user_id   : token_user_id,
      book_img  : book_img,
      book_desc : book_desc
    });

    data.save(function(err, docs) {
      if (err) { return next(err); }
      res.json({ success: 1, message: "photo is uploaded" });
    });
  };
  // imgSave function end

  UserModel.findOne({ user_id: token_user_id }, function(err, docs) {
    if (err) { return next(err); }
    if (docs.user_type == "M" || docs.user_type == "P") {
      imgSave();
    } else {
      res.json({ success: 0, message: "You should be registered as a model or photographer first" });
    }
  });
});
