var express = require('express');
const session = require('express-session');
const res = require('express/lib/response');
const { log } = require('handlebars');
const async = require('hbs/lib/async');
const { TaskRouterGrant } = require('twilio/lib/jwt/AccessToken');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');
const { response } = require('../app');
const adminHelper = require('../helpers/adminHelper');
const userHelper = require('../helpers/userHelper');
var router = express.Router();
var usersHelper = require('../helpers/userHelper');
const { route } = require('./admin');


// paypal................................................................................
var paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AXZo56O1wY_CK2zuMqHcpfjwJIKasLu0XNbnVt0iev_3H071_x1c0aOs2ipg12L4f9dMKKnnDWECInbE',
  'client_secret': 'ECWRerRUqh8mBvQATzSA_hfmtxHYuweRupmPJGtKJ9JveJEwvb-auHCnNbz2Ubfi0uXo2DxDx8QJ0LzJ'
});

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
  let women = await userHelper.women()
  let men = await userHelper.men()
  let kids = await userHelper.kids()

  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelper.cartCount(user._id)

  }
  let banner = await userHelper.viewBanner()
  adminHelper.viewProducts().then((products) => {



    if (req.session.status == true) {
      let status = "*Admin Blocked"
      res.render('user/login', { status, })

    }


    res.render('user/home', { users: true, user, products, cartCount, banner, women, men, kids });
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
      req.session.userAlreadyExist = "*Sorry you already have an account"
      res.redirect('/signup')
    }
    else {
      req.session.user = req.body
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
router.get('/otpVerification', (req, res, next) => {

  if (req.session.doNotMatch) {
    var OtpError = "Miss Match otp"
    res.render('user/otpverify', { OtpError })
  }
  else {
    res.render('user/otpverify')
  }
})

router.post('/otpVerificationForUserSignUp', (req, res, next) => {
  let user = req.session.user
  const { otp } = req.body;
  var userData = req.session.contact
  client.verify.services(SERVICE_ID).verificationChecks.create({
    to: `+91${userData}`,
    code: otp
  }).then((data) => {
    if (data.status == 'approved') {
      userHelper.doSignUp(user).then(() => {
        res.redirect('/')
      })

    }
    else {
      req.session.doNotMatch = invalidOtp

      res.redirect('/otpVerification')
    }
  })
})

router.get('/contact', (req, res, next) => {
  if (req.session.errorId) {
    let phone = "phone Number do not registerd"
    res.render('user/contact', { phone })
  }
  else {
    res.render('user/contact')
  }
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
      res.redirect('/contact')

    }
  })
})
// Resent OTP
router.post('/resentOtp', (req, res, next) => {
  let number = req.session.contact


  client.verify.services(SERVICE_ID).verifications.create({
    to: `+91${number}`,
    channel: "sms"
  })
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
      req.session.doNotMatch = true

      res.redirect('/otpVerification')
    }
  })
})
router.get('/logout', (req, res, next) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/product-details/', verifyLogin, async (req, res, next) => {
  let user = req.session.user
  cartCount = await userHelper.cartCount(user._id)

  let productDetails = await adminHelper.viewProductsDetails(req.query.id)



  res.render('user/singleProduct', { users: true, productDetails, user, cartCount })

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
  req.session.products = products
  let user = req.session.user
  let total = 0
  if (products.length > 0) {
    total = await userHelper.getTotal(user._id)
  }

  cartCount = await userHelper.cartCount(user._id)

  res.render('user/cart', { users: true, products, user, cartCount, total })
})

router.get('/cart/:id', verifyLogin, (req, res, next) => {


  userHelper.addToCart(req.params.id, req.session.user._id).then((data) => {

    res.json({ status: true })
  })

})
// change Product quantity..............................................................................................
router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProductQuntity(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/removeProductFromCart', (req, res, next) => {
  userHelper.remProFromCart(req.body).then((response) => {
    res.json(response)
  })

})
router.get('/placeOrder', verifyLogin, async (req, res, next) => {
  
  let user = req.session.user
  let cartCount = await userHelper.cartCount(user._id)
  let total = 0
  if (cartCount > 0) {
    total = await userHelper.getTotal(user._id)
  }

  let products = req.session.products
  res.render('user/checkOut', { users: true, user, total, products, cartCount })
})
// place order.....................................................................................................................
router.post('/placeOrder', verifyLogin, async (req, res, next) => {
  cartProd = await userHelper.cartProducts(req.body.userId)
  let total = await userHelper.getTotal(req.body.userId)
  userHelper.placeOrder(req.body, cartProd, total).then((orderId) => {
    req.session.orderId=orderId
    if(req.body.method=='COD'){ 
  

      res.json({codStatus:true})
    }
    else if(req.body.method=='RazorPay'){
      userHelper.generateRazorpay(orderId,total).then((response)=>{
  console.log(response)
        
        res.json(response)

      }) 
    } 
     else if(req.body.method=='payPal'){
  res.json({paypal:true})
     }
    
  })  
}) 
router.post('/verifyPayment',(req,res,next)=>{
userHelper.verifyPay(req.body).then(()=>{
  res.json({status:true})
})
 
})
 
router.get('/orderSuccess', async(req, res, next) => {
  let user = req.session.user
 let orderId= req.session.orderId
 await userHelper.productRemoveFromCart(user._id,orderId).then(()=>{
  res.render('user/orderSuccess', { users: true, user }) 
})
})

router.get('/order', verifyLogin, async (req, res, next) => {
  let user = req.session.user
  let orders = await userHelper.getuserOrders(user._id)
  res.render('user/order', { users: true, user, orders })
})


router.get('/viewOrderProd/', async (req, res, next) => {
  let user = req.session.user
  let viewProOrderlist = await userHelper.getOrderPro(req.query.id)
  res.render('user/viewOrderProductList', { user, users: true, viewProOrderlist })
})
router.post('/cancelOrder', (req, res, next) => {
  userHelper.cancelOrder(req.body.orderList)
})
// testing page.................................................................
router.get('/test', (req, res, next) => {
  res.render('user/test')
})
// verify Payment...............................................................
router.get('/pay', (req, res) => {
  console.log("shibu hero");
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "juta proucts",
                "sku": "001",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "Hat for the best team ever"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  console.log(payment)
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});





router.get('/success', (req, res) => {
  console.log("success.............................................................................................")
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "25.00"
      }
    }]
  };
})



  router.get('/cancel', (req, res) => res.send('Cancelled'));
// end paypal

// myProfile..........................................................................................................
router.get('/myProfile', (req, res, next) => {
  let user = req.session.user
let passwordChanged= req.session.changed

  res.render('user/myProfile', { users: true, user,passwordChanged})

})
// edit Profile.......................................................................................................
router.get('/editProfile', (req, res, next) => {
  let user = req.session.user
  res.render('user/editProfile', { user, users: true })
})



router.post("/editProfile", (req, res, next) => {

  let id = req.session.user._id

  userHelper.updateProfile(id, req.body).then((updatedData) => {

    if (req.files) {
      let image = req.files.image1
      image.mv('./public/profileImage/' + id + 'image.jpg', (err) => {
        if (!err) {
          res.redirect('/myProfile')
        }
      })
    }
    else {
      res.redirect('/myProfile')
    }


  }) 

})
// change Password...........................................................
router.get('/changePassword', (req, res, next) => {
let falsePassword= req.session.falsePassword 

  let user = req.session.user

  res.render('user/changePassword', { users: true, user,falsePassword})
})


router.post('/changePassword', async (req, res, next) => {
  console.log(req.body)
   let user = req.session.user
 let currentPassword=req.body.currentPassword
let result= await userHelper.PasswordChecking(currentPassword, user)
  if(result==true){
   userHelper.updatePassword(req.body.confirmPassword,user._id)

   req.session.changed="Password changed Successfully"
res.redirect('/myProfile')
  }
  else{

    req.session.falsePassword = "Sorry,Your current Password is wrong"
    res.redirect('/changePassword')
  }

 }) 
   

module.exports = router;              

