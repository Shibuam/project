var express = require('express');
const res = require('express/lib/response');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');
const { response } = require('../app');
const userHelper = require('../helpers/userHelper');
var router = express.Router();
var usersHelper = require('../helpers/userHelper')

// Otp verification
const SERVICE_ID = "VA8cb715309d028270bf78e01cb99b48d4"
const ACCOUNT_SID = "AC0cf099a40e0127b5f6bc9832b90bdbee"
const AUTH_TOKEN = "af35724e003c285813622ec44122505b"
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN)

/* GET home page. */
router.get('/', function (req, res, next) {
  let user= req.session.user
  if(req.session.status==true){
    let  status="*Admin Blocked"
    res.render('user/login',{status})
  }
  // let blocked=req.session.status
  usersHelper.viewProduct().then((prod)=>{
 
  res.render('user/home',{users:true,user,prod});
 })
   });
router.get('/login', function (req, res, next) {
  let error=req.session.error
  if(req.session.status==true){
     
  }
  res.render('user/login',{error});
});
router.post('/home', function (req, res, next) {
  usersHelper.doLogin(req.body).then((response) => {
    
        if (response.status) {
     req.session.status=response.user.isblock
            req.session.loggedIn=true,
        req.session.user=response.user
   
      res.redirect("/")
    }
    else {
      req.session.error="You are not a registererd user Or missmatch password  "
      
      res.redirect('/login')
    }
  })

});
router.get('/signup', function (req, res, next) {
  res.render('user/signup');
});    


router.post('/signup', function (req, res, next) {
 
  usersHelper.doSignUp(req.body).then((response) => {

 
    res.redirect('/')
  })
});
router.get('/contact',(req,res,next)=>{
res.render('user/contact')
})
router.post('/numberChecking',(req,res,next)=>{
userHelper.findContact(req.body).then((number)=>{
if(number){
  
  req.session.contact=number.phone
  client.verify.services(SERVICE_ID).verifications.create({
    to: `+91${req.body.phone}`,
    channel: "sms"
  })
  res.render('user/otpverify')
}
else{
  req.session.errorId=true
 res.redirect('/signup')
}
})
})
router.get('/otpVerification',(req,res,next)=>{
  res.render('user/otpverify')
})

router.post('/otpVerification', (req, res, next) => {
  const { otp} = req.body;
  var userData=req.session.contact
  client.verify.services(SERVICE_ID).verificationChecks.create({
    to: `+91${userData}`,
    code: otp
  }).then((data)=>{
    if(data.status=='approved')
   {
    res.redirect('/')
   }
   else{
     res.redirect('/otpVerification')
   }
     })
})
router.get('/logout',(req,res,next)=>{
console.log(req.session.loggedIn)
res.redirect('/')
})
router.get('/productList',(req,res,next)=>{
  res.render('user/Product-list')
})
 

module.exports = router;
