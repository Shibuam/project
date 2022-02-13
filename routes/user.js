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
  'client_id': 'AYB0IuN_ArwxRXU7eE2dP0H8dYa7raoQmSUvk9usER8Yv0Cbm2CCkggOV6hV_0vKcMPV48U65CLptQmg',
  'client_secret': 'ENbTS3lTZ-KOQsX9EzT_ve-2bFxPshEGfIPdBmIktWTZr2fjIRv9Uv6hOIHBxI4aWZKP8sf0PeCZGUZa'
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
//   let women = await userHelper.women()
//   let men = await userHelper.men()
//   let kids = await userHelper.kids()
// let products=req.session.product
   
  let user = req.session.user
  let cartCount = 0
  let wishCount = 0
  if (user) {
    wishCount = await userHelper.wishListCount(user._id)
    cartCount = await userHelper.cartCount(user._id)

  }
  let banner = await userHelper.viewBanner()
let category='all'
let fill=false
fill=req.session.fill
   let products=await userHelper.viewProduct(category)
   if(fill==true){
  products=req.session.product
   }
 console.log("............................................")
 console.log(products);

    if (req.session.status == true) {
      let status = "*Admin Blocked"
      res.render('user/login', { status, })

    }


    res.render('user/home', { users: true, user, wishCount, products, cartCount, banner, });
  
});
// filter the Product.............................................................................................................................................

 router.get("/filter/:value",async(req,res,next)=>{
  
 let category=req.params.value
 req.session.product=await userHelper.viewProduct(category)
 req.session.fill=true
res.redirect('/')
})


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

router.get('/home', function (req, res, next) {
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
  let fromWishList=req.params.addToWishList
  let products = await userHelper.viewToCart(req.session.user._id)
  req.session.products = products
  let user = req.session.user
  let addres = await userHelper.viewAddress(user._id)
  let total = 0
  if (products.length > 0) {
    total = await userHelper.getTotal(user._id)
  }

  cartCount = await userHelper.cartCount(user._id)

  res.render('user/cart', { users: true, products, user, addres,fromWishList, cartCount, total })
})

// add to Cart......................................................................................................

router.get('/cart/:id', verifyLogin, (req, res, next) => {


  userHelper.addToCart(req.params.id, req.session.user._id).then((data) => {

    res.json({ status: true })
  })

})
// Add to Wish list...................................................................................................
router.get('/addToWishlist/:id', async(req, res, next) => {
  let user = req.session.user
  let proId = req.params.id
 await userHelper.addToWishlist(proId, user._id).then((response) => {
   
    res.json(response)
  })

})
// view wish list.....................................................................................................
router.get('/viewWishList',verifyLogin,async(req,res,next)=>{
   let user = req.session.user
   wishCount = await userHelper.wishListCount(user._id)
   cartCount = await userHelper.cartCount(user._id)
let wishlist=  await userHelper.viewToWishList(user._id)

  res.render('user/wishlist',{users:true,wishlist,wishCount,user,cartCount})
})
// add to cart from wish list.......................................................
router.get('/addToCartFromWishList/:id',async(req,res,next)=>{
  let user = req.session.user
 await userHelper.addToCartFromWishList(user._id,req.params.id).then(()=>{
    userHelper.removeFromWishList(req.params.id,user._id).then(()=>{
      req.params.addToWishList="*Product Add to wishList"
      res.redirect('/viewCart')
    })

  })
})

//Remove Product from wishlist.............................................................................................
router.get('/removeFromWishList/:id',async(req,res,next)=>{
  let user = req.session.user
  await userHelper.removeFromWishList( req.params.id,user._id).then((response)=>{
    res.json(response)
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
  let viewAddress = await userHelper.viewAddress(user._id)

  let products = req.session.products
  res.render('user/checkOut', { users: true, user, total, products, cartCount, viewAddress })
})
// place order.....................................................................................................................
router.post('/placeOrder', verifyLogin, async (req, res, next) => {
 
  let user = req.session.user
  let method = req.body.method
  let address = await userHelper.findOneAddress(req.body.address)

  cartProd = await userHelper.cartProducts(user._id)
  let total = await userHelper.getTotal(user._id)
  userHelper.placeOrder(address, method, cartProd, total,).then((orderId) => {
    req.session.orderId = orderId
    if (req.body.method == 'COD') {


      res.json({ codStatus: true })
    }
    else if (req.body.method == 'RazorPay') {
      userHelper.generateRazorpay(orderId, total).then((response) => {
       

        res.json(response)

      })
    }
    else if (req.body.method == 'payPal') {
      res.json({ paypal: true })
    }

  })
})
router.post('/verifyPayment', (req, res, next) => {
  userHelper.verifyPay(req.body).then(() => {
    res.json({ status: true })
  })

})

router.get('/orderSuccess', verifyLogin, async (req, res, next) => {
  let user = req.session.user
  let orderId = req.session.orderId
  await userHelper.productRemoveFromCart(user._id, orderId).then(() => {
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
          "name": "Red Sox Hat",
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
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });

});





router.get('/success', (req, res) => {
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

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
    
      throw error;
    } else {
    

      res.redirect('/orderSuccess')
    }
  });
});



router.get('/cancel', (req, res) => res.send('Cancelled'));
// end paypal

// myProfile..........................................................................................................
router.get('/myProfile', verifyLogin, (req, res, next) => {
  let user = req.session.user
  let passwordChanged = req.session.changed

  res.render('user/myProfile', { users: true, user, passwordChanged })

})
// edit Profile.......................................................................................................
router.get('/editProfile', verifyLogin, (req, res, next) => {
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
router.get('/changePassword', verifyLogin, (req, res, next) => {
  let falsePassword = req.session.falsePassword

  let user = req.session.user

  res.render('user/changePassword', { users: true, user, falsePassword })
})


router.post('/changePassword', async (req, res, next) => {

  let user = req.session.user
  let currentPassword = req.body.currentPassword
  let result = await userHelper.PasswordChecking(currentPassword, user)
  if (result == true) {
    userHelper.updatePassword(req.body.confirmPassword, user._id)

    req.session.changed = "Password changed Successfully"
    res.redirect('/myProfile')
  }
  else {

    req.session.falsePassword = "Sorry,Your current Password is wrong"
    res.redirect('/changePassword')
  }

})
//  Add address...............................................................................................
router.get('/manageAddress', verifyLogin, async (req, res, next) => {
  let user = req.session.user
  let deleteMessage = req.session.deleteMessage
  await userHelper.viewAddress(user._id).then((viewAddress) => {


    res.render('user/address', { users: true, user, viewAddress, deleteMessage })
  })
})
router.post('/addAddress', async (req, res, next) => {


  await userHelper.addAddress(req.body).then(() => {
    res.redirect('/manageAddress')
  })
})
// delete Address.....................................................................................................
router.get('/deleteAddress/:id', verifyLogin, (req, res, next) => {
  req.session.deleteMessage = "*Address Deleted Successfully.."
  userHelper.deleteAddress(req.params.id).then(() => {
    res.redirect('/manageAddress')
  })
})
router.get('/editAddress/:id', verifyLogin, (req, res, next) => {
  let user = req.session.user

  userHelper.findAddress(req.params.id).then((address) => {
    req.session.address = address._id
    res.render('user/editAddress', { address, user, users: true })
  })
})
//edit Address........................................................................................
router.post('/editAddress', async (req, res, next) => {
  id = req.session.address
  await userHelper.editAddress(req.body, id)
  res.redirect('/manageAddress')

})
router.post('/addNewInCheckOut', async (req, res, next) => {
  await userHelper.addAddress(req.body).then(() => {
    res.redirect('/placeOrder')
  })
})

module.exports = router;

