var express = require('express');
var SparkPost = require('sparkpost');
var sp = new SparkPost('9bf6b6d7079252cab943971ff90c08cc3a9cee0d');
var port = process.env.PORT || 3000
var bodyParser = require('body-parser');
var path = require('path');
var expressValidator = require('express-validator');
var mongojs = require('mongojs')
var mongodb = require('mongodb')
// var db = mongojs('mongodb://ds143717.mlab.com:43717/shubham', ['users']);
var collections = ["users", "blog", "comments", "property", "images", "notification", "bookmark", "messages","timetable", "timetablecategory", "timetablequestion", "resume", "skills", "locations"]

var db = mongojs('mongodb://shubham20.yeole:shubham20.yeole@ds163387.mlab.com:63387/paceteam3', collections)

var app = express();
var ObjectId = mongojs.ObjectId;
var passport = require("passport")

var JSFtp = require("jsftp");


var fs = require('fs');
var config = {
  host: 'ftp.byethost8.com',
  port: 21,
  user: 'b8_19205430',
  password: 'Shubham4194'
}

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname)));
// body parser middleware
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb',extended: false}));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname)));

var fs = require('fs');



var multiparty = require('connect-multiparty'),
  multipartyMiddleware = multiparty();
  app.use(multipartyMiddleware);
    app.use(function(req, res, next){
      fs.appendFile('logs.txt', req.path + "token:" + req.query.access_token+'', 
        function(err){
          next(); 
        });
  });
// set static path



 var errmsg = "Computer Science Project";
app.get('/', function(req, res){       
  db.resume.find(function (err, resume) {
    res.render("index.ejs", {message:"", resumecount: resume.length});
  });
});

app.post('/getmatch', function(req, res){   
  var skills = req.body.skills;
  db.resume.find(function (err, resumeContent) {
    res.send(resumeContent);    
  });
});

app.post('/upload', function(req, res){       
  var file = req.files.file;
  var filepath = file.path;
  var fullname = req.body.fullname;
  var email = req.body.email;
  var timestamp = new Date().valueOf();
  var Client = require('ftp');
  var date = new Date();
  var datetime = (date.getMonth()+1)+" / "+date.getDate()+" / "+date.getFullYear()+" at "+date.getHours()+":"+date.getMinutes();
  let PDFParser = require("pdf2json");
  let pdfParser = new PDFParser(this,1);
  pdfParser.loadPDF(file.path);         

  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
  pdfParser.on("pdfParser_dataReady", pdfData => {
  var resumeContent = pdfParser.getRawTextContent();
      var c = new Client();
      c.on('ready', function() {
        c.put(file.path, 'htdocs/resume/shubham-resume-selector-project-'+timestamp+"-"+file.originalFilename, function(err) {
          if (err) throw err;
          c.end();
        });
      });
      c.connect(config);
      var resumeurl = 'http://shubhamyeole.byethost8.com/resume/shubham-resume-selector-project-'+timestamp+"-"+file.originalFilename;
      var newResume = {
        fullname: fullname,
        email: email,
        filename: file.originalFilename,
        resume: resumeurl,
        timestamp: timestamp,
        datetime: datetime,
        resumetext: resumeContent
      }
      db.resume.insert(newResume, function(err, result){
        if(err){console.log(err);}
         db.resume.find(function (err, resume) {
            res.render("index.ejs", {message:"Thank you for submitting your Resume. We will review your application and contact you shortly.", resumecount: resume.length});
          })        
        });
      });   
});

app.post('/upload2', function(req, res){       
  var file = req.files.file;
  var filepath = file.path;
  var timestamp = new Date().valueOf();
  var Client = require('ftp'); 
  var c = new Client();
    c.on('ready', function() {
      c.put(file.path, 'htdocs/public_html/career/'+file.originalFilename, function(err) {
        if (err) throw err;
         c.end();
        });
   });
   c.connect(config);
   res.redirect("/");     
});

app.post('/addloc', function(req, res){
var date = new Date();
var datetime = date.getMonth()+1+"/"+date.getDate()+"/"+date.getFullYear()+" at "+date.getHours()+":"+date.getMinutes();
var long = req.body.long;
var lat = req.body.lat;
var whatdone = req.body.task;
var lat_1 = Number(lat)-0.000203;
var lat_2 = Number(lat)+0.000203;
var long_1 = Number(long)-0.00070989999;
var long_2 = Number(long)+0.00070989999;     
db.locations.findOne({
       $and : [
          { $and : [ { lat : { $gt: lat_1} }, { lat : { $lt: lat_2} } ] },
          { $and : [ { long: { $gt: long_1} }, { long : { $lt: long_2} } ] }
      ]
      }, function(err, location) {
      if (!location) {
        var newLoc = {
          visittime: 1,
          re_c: 0,
          tt_c: 0,
          bb_c: 0,
          rs_c: 1,
          re_task: "",
          tt_task: "",
          bb_task: "",
          rs_task: whatdone+" ("+datetime+")",
          long: Number(long),
          lat: Number(lat)
        }
        db.locations.insert(newLoc, function(err, result){
        if(err){console.log(err);}
        res.send("INSERTED");
        });
      }else {
        var count = location.visittime+1;
        var cc = location.rs_c+1;
        whatdone = whatdone+" ("+datetime+"),"+location.rs_task;
        db.locations.update({_id: location._id},{$set : {"visittime": count, "rs_c": cc, "rs_task": whatdone}},{upsert:true,multi:false});
        res.send("UPDATED: "+count);
      }
  });
});


app.listen(port, function() {
  console.log('Listening on port ' + port)
})