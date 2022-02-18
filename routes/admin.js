var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var userHelper = require('../helpers/userHelper')
var adminHelper = require('../helpers/adminHelper');
const async = require('hbs/lib/async');
const { localsAsTemplateData } = require('hbs');
var hbs = require("hbs")
hbs.registerHelper("equal", require('handlebars-helper-equal'))

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('admin/login')
});
router.get('/home', (req, res, next) => {
  let admin = req.session.admin
  res.render('admin/home', { admin: true, admin })
})

router.get('/login', (req, res, next) => {
  res.render('admin/login')
})
router.post('/login', (req, res, next) => {
  adminHelper.adminLogin().then((data) => {
    let adminData = data
    if (adminData.name == req.body.name && adminData.password == req.body.password) {
      req.session.admin = data.name
      res.redirect('/admin/home')
    }
    else {
      res.redirect('/admin/login')
    }

  })

})
router.get('/viewUser', function (req, res, next) {
  userHelper.doUser().then((userdata) => {
    res.render('admin/viewUser', { userdata, admin: true })
  })

});
router.get('/addProduct', (req, res, next) => {


  adminHelper.viewCategory().then((category) => {
    adminHelper.Subcategory().then((Subcategory) => {

      res.render('admin/AddProduct', { admin: true, category, Subcategory })
    })
  })
})
router.get('/viewProducts', (req, res, next) => {

  adminHelper.viewProducts().then((products) => {

    res.render('admin/viewProducts', { products, admin: true })
  })
})

// .......................Add Products............................................................
router.post('/addProducts', (req, res, next) => {
  req.body.mrp = parseInt(req.body.mrp)

  adminHelper.addProduct(req.body).then((id) => {

    let image = req.files.image1;
    let image2 = req.files.image2;
    let image3 = req.files.image3;
    let image4 = req.files.image4;

    id = id.insertedId;
    image.mv('./public/images/proImage/' + id + 'image.jpg', (err) => {
      if (!err) {
        image2.mv('./public/images/proImage/' + id + 'image2.jpg', (err) => {
          if (!err) {
            image3.mv('./public/images/proImage/' + id + 'image3.jpg', (err) => {
              if (!err) {
                image4.mv('./public/images/proImage/' + id + 'image4.jpg', (err) => {
                  if (!err) {
                    res.redirect('/admin/viewProducts')
                  }
                })
              }
            })
          }
        })
      }
    })
  })
})
router.get('/editProduct/', async (req, res, next) => {

  let product = await adminHelper.editProducts(req.query.id)
  adminHelper.viewCategory().then((category) => {
    adminHelper.Subcategory().then((Subcategory) => {

  res.render('admin/editProduct', { product, admin: true,category, Subcategory })
})
  })
});


router.post('/editProducts/:id', (req, res, next) => {

  req.body.mrp = parseInt(req.body.mrp)
  adminHelper.updateProduct(req.params.id, req.body).then((id) => {
   if(req.file){
      let image = req.files.image 
      let image2 = req.files.image2;
      let image3 = req.files.image3;
      let image4 = req.files.image4;  
      if(image){

        image.mv('./public/images/proImage/' + req.params.id + 'image.jpg')
      }
      if(image2){
        image2.mv('./public/images/proImage/' + req.params.id + 'image2.jpg')
      }
      if(image3){
        image3.mv('./public/images/proImage/' + req.params.id + 'image3.jpg',)
      }
      if(image4){
        image4.mv('./public/images/proImage/' + req.params.id + 'image4.jpg')
      }
    }
    
    res.redirect('/admin/viewProducts')
  })

})

router.get('/deleteProduct/:id', (req, res, next) => {
  let productId = req.params.id
  adminHelper.deleteProduct(productId).then((data) => {
    res.redirect('/admin/viewProducts')
  })

})
router.get('/block/:id', (req, res, next) => {
  let userId = req.params.id
  userHelper.block(userId).then(() => {
    res.redirect('/admin/viewUser')
  })


})
router.get('/unblock/:id', (req, res, next) => {
  let userId = req.params.id
  userHelper.unblock(userId).then(() => {
    res.redirect('/admin/viewUser')
  })
})
router.get('/addEdit-category', (req, res, next) => {

  let Subcategory = req.session.Subcategory

  adminHelper.viewCategory().then((category) => {

    res.render('admin/addEdit-category', { admin: true, category, Subcategory })
  })
})
//})
router.post('/addCategory', (req, res, next) => {

  adminHelper.addCategory(req.body).then(() => {
    res.redirect('/admin/addEdit-category')
  })

})

router.post('/addSubCategory', (req, res, next) => {

  adminHelper.addingSubCategory(req.body)
  res.redirect('/admin/addEdit-category')
})

router.get('/deleteSubCategory/:id', (req, res, next) => {
  let id = req.params.id

  adminHelper.deleteSubCategory(id).then((data) => {

    res.redirect('/admin/addEdit-category')
  })
})

router.get('/deleteCategory/:id', (req, res, next) => {
  let id = req.params.id
  adminHelper.deleteCategory(id).then((data) => {
    res.redirect('/admin/addEdit-category')
  })
})

router.get('/viewSubCategory/:category', (req, res, next) => {
  let id = req.params.category

  adminHelper.viewSubCategory(id).then((data) => {
    req.session.Subcategory = data

    res.redirect('/admin/addEdit-category')
  })
})
router.get('/logout', (req, res, next) => {
  req.session.admin = null
  res.redirect('/admin')
})
router.get('/orderManage', async (req, res, next) => {
  let orderList = await adminHelper.orderMng()

  res.render('admin/orderManagement', { orderList, admin: true })
})
router.get('/bannerManagement', (req, res, next) => {
  res.render('admin/bannerManage', { admin: true })
})
// ..............................Adding Banner....................................................................
router.post('/addBanners', (req, res, next) => {


  adminHelper.addBanner(req.body).then((id) => {


    let image1 = req.files.image1;
    let image2 = req.files.image2;
    let image3 = req.files.image3;



    image1.mv('./public/bannerImage/' + id.insertedId + 'image.jpg', (err) => {
      if (!err) {
        image2.mv('./public/bannerImage/' + id.insertedId + 'image2.jpg', (err) => {
          if (!err) {
            image3.mv('./public/bannerImage/' + id.insertedId + 'image3.jpg', (err) => {
              if (!err) {

                res.redirect('/admin/bannerManagement')



              }
            })
          }
        })
      }
    })

  })
})
router.post('/changeOrderStatus', (req, res, next) => {
  
 
  adminHelper.updateStatus(req.body.value, req.body.id).then(()=>{
    res.redirect('/admin/orderManage')
  })
})
// offer management.................................................................
router.get('/addOffer',async(req,res,next)=>{
  let product=  await adminHelper.viewProducts()

 await adminHelper.viewCategory().then((category) => {

  res.render('admin/createOffer',{admin:true,category,product })
})
})
//view Offer...........................................
router.get('/viewOffer',async(req,res,next)=>{
  let reply= req.session.resp
 
  await  adminHelper.viewOffer().then((offer)=>{
    res.render('admin/viewOffer',{offer,admin:true,reply})
  })
})
// add offer on category basis..........................................

router.post('/addOffer',async(req,res,next)=>{

  await adminHelper.addOffer(req.body).then((respo)=>{
    req.session.resp=respo.data
//    console.log( req.session.resp)
   res.redirect('/admin/viewOffer')
  })

 
})
router.get('/cancelOffer/:category',async(req,res,next)=>{
 
 console.log(req.params.category)
 await adminHelper.cancelOffer(req.params.category).then((respo)=>{
  req.session.resp=respo.data
  res.redirect('/admin/viewOffer')
 })
})
// add offer on the basis of product................................................................
router.post('/addOfferForProduct',async(req,res,next)=>{
  console.log(req.body)
  await adminHelper.addOfferProduct(req.body).then((respo)=>{
   
    req.session.resp=respo.data

   res.redirect('/admin/viewOffer')
})
})
router.get('/cancelOfferPro/:product',async(req,res,next)=>{

 await adminHelper.cancelOfferOfPro(req.params.product).then((resp)=>{
    req.session.resp=respo.data

     res.redirect('/admin/viewOffer')
  })
})



module.exports = router;
