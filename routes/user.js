var express = require('express');
const session = require('express-session');
const res = require('express/lib/response');
const async = require('hbs/lib/async');
const { TaskRouterGrant } = require('twilio/lib/jwt/AccessToken');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');
const { response } = require('../app');
const adminHelper = require('../helpers/adminHelper');
const userHelper = require('../helpers/userHelper');
var router = express.Router();
var usersHelper = require('../helpers/userHelper');
const { route } = require('./admin');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {

    res.redirect('/login')
  }
}

// Otp verification
const SERVICE_ID = "VA8cb715309d028270bf78e01cb99b48d4"
const ACCOUNT_SID = "AC0cf099a40e0127b5f6bc9832b90bdbee"
const AUTH_TOKEN = "af35724e003c285813622ec44122505b"
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN)

/* GET home page. */
router.get('/', async (req, res, next) => {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelper.cartCount(user._id)
req.session.cartCount=cartCount
  }
  adminHelper.viewProducts().then((products) => {



    if (req.session.status == true) {
      let status = "*Admin Blocked"
      res.render('user/login', { status, })

    }


    res.render('user/home', { users: true, user, products, cartCount });
  })
});

router.get('/login', function (req, res, next) {
  let error = req.session.error
  // if(req.session.status==true){
  //   console.log(req.session.status);
  // }
  res.render('user/login', { error, users: true });
});

router.post('/home', function (req, res, next) {
  usersHelper.doLogin(req.body).then((response) => {

    if (response.status) {
      req.session.status = response.user.isblock
      req.session.loggedIn = true,
        req.session.user = response.user

      res.redirect("/")
    }
    else {
      req.session.error = "You are not a registererd user Or missmatch password  "

      res.redirect('/login')
    }
  })

});
router.get('/signup', function (req, res, next) {
  let alreadyExist = req.session.userAlreadyExist
  res.render('user/signup', { alreadyExist, users: true });
});


router.post('/signup', function (req, res, next) {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      // req.session.userAlreadyExist=response.status
      res.send('already exist')
    }
    else {
      req.session.userdetails = req.body
      req.session.contact = req.body.phone
      client.verify.services(SERVICE_ID).verifications.create({
        to: `+91${req.body.phone}`,
        channel: "sms"
      })

      let userdetails = req.session.userdetails
      res.render('user/otpVerifyForUserSignUP')
    }

  })
});
router.post('/otpVerificationForUserSignUp', (req, res, next) => {

  const { otp } = req.body;
  var userData = req.session.contact
  client.verify.services(SERVICE_ID).verificationChecks.create({
    to: `+91${userData}`,
    code: otp
  }).then((data) => {
    if (data.status == 'approved') {
      res.redirect('/')
    }
    else {
      res.redirect('/otpVerification')
    }
  })
})

router.get('/contact', (req, res, next) => {
  res.render('user/contact')
})
router.post('/numberChecking', (req, res, next) => {
  userHelper.findContact(req.body).then((number) => {

    if (number) {

      req.session.contact = number.phone
      client.verify.services(SERVICE_ID).verifications.create({
        to: `+91${req.body.phone}`,
        channel: "sms"
      })
      res.render('user/otpverify')
    }
    else {
      req.session.errorId = true
      res.redirect('/signup')
    }
  })
})
router.get('/otpVerification', (req, res, next) => {
  res.render('user/otpverify')
})

router.post('/otpVerification', (req, res, next) => {
  const { otp } = req.body;
  var userData = req.session.contact
  client.verify.services(SERVICE_ID).verificationChecks.create({
    to: `+91${userData}`,
    code: otp
  }).then((data) => {
    if (data.status == 'approved') {
      res.redirect('/')
    }
    else {
      res.redirect('/otpVerification')
    }
  })
})
router.get('/logout', (req, res, next) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/product-details', (req, res, next) => {
  adminHelper.viewProducts().then((products) => {
    adminHelper.viewProductsMen().then((men))
    let user = req.session.user
    res.render('user/view-product-with-image-zoo', { users: true, products, user, men })
  })
})
router.get('/numberVerification', (req, res, next) => {
  client.verify.services(SERVICE_ID).verifications.create({
    to: `+91${req.body.phone}`,
    channel: "sms"
  })
  res.render('user/otpverify')
})

router.get('/viewCart', verifyLogin, async (req, res, next) => {
  let products = await userHelper.viewToCart(req.session.user._id)
  let user = req.session.user
  let total = await userHelper.getTotal(user._id)
 let cartCount=req.session.cartCount

  res.render('user/cart', { users: true, products, user,cartCount,total})
})

router.get('/cart/:id', verifyLogin, (req, res, next) => {


  userHelper.addToCart(req.params.id, req.session.user._id).then((data) => {

    res.json({ status: true })
  })

})
router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProductQuntity(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/removeProductFromCart', (req, res, next) => {
 userHelper.remProFromCart(req.body).then((response)=>{
  res.json(response)
 })
 
})
router.get('/checkOut', verifyLogin, async (req, res, next) => {
  let user = req.session.user
  let total = await userHelper.getTotal(user._id)
  console.log(total);
  res.render('user/checkOut', { users: true, user, total })
})


module.exports = router;

