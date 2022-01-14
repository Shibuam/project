var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var userHelper=require('../helpers/userHelper')
var adminHelper=require('../helpers/adminHelper');
const async = require('hbs/lib/async');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/login')
});
router.get('/home',(req,res,next)=>{
res.render('admin/home',{admin:true})
})

router.get('/login',(req,res,next)=>{
res.render('admin/login')
})       
router.post('/login',(req,res,next)=>{
 adminHelper.adminLogin().then((data)=>{
   let adminData=data
 if(adminData.name==req.body.name&&adminData.password==req.body.password){
  res.redirect('/admin/home')
 }
 else{
  res.redirect('/admin/login')
 }

 })

})
router.get('/viewUser', function(req, res, next) {
  userHelper.doUser().then((userdata)=>{
    res.render('admin/viewUser',{userdata,admin:true})
  })
  
});
router.get('/addProduct',(req,res,next)=>{
  res.render('admin/AddProduct',{admin:true})
})
router.get('/viewProducts',(req,res,next)=>{
  adminHelper.viewProducts().then((products)=>{
    res.render('admin/viewProducts',{products,admin:true})
  })
 
})
router.post('/addProducts',(req,res,next)=>{
 
  adminHelper.addProduct(req.body).then((id)=>{
    //console.log(req.files.image);
    let image = req.files.image;
    id=id.insertedId;
    image.mv('./public/images/proImage/'+id+'.jpg',(err,data)=>{
if(!err){
  res.redirect('/admin/viewProducts')
}else{
  res.redirect('/admin/addProduct')
}
    })
       })
})
router.get('/editProduct/:id',async(req,res,next)=>{
 let product =await adminHelper.editProducts(req.params.id)
  
  res.render('admin/editProduct',{product,admin:true})
  })
  router.post('/editProducts/:id',(req,res,next)=>{
    adminHelper.updateProduct(req.params.id,req.body).then((id)=>{
              if(req.files.image){
        let image=req.files.image
        image.mv('./public/images/proImage/'+req.params.id+'.jpg')
      }
      res.redirect('/admin/viewProducts')
    })
    
  })
  
router.get('/deleteProduct/:id',(req,res,next)=>{
  let productId=req.params.id
  adminHelper.deleteProduct(productId).then((data)=>{
    res.redirect('/admin/viewProducts')
  })
 
})
router.get('/block/:id',(req,res,next)=>{
  let userId=req.params.id
  userHelper.block(userId).then(()=>{
    res.redirect('/admin/viewUser')
  })
 
  
})
router.get('/unblock/:id',(req,res,next)=>{
  let userId=req.params.id
  userHelper.unblock(userId).then(()=>{
    res.redirect('/admin/viewUser')
  })
   })
router.get('/addEdit-category',(req,res,next)=>{
  res.render('admin/addEdit-category',{admin:true})
})
router.post('/addCategory',(req,res,next)=>{
  
  adminHelper.addCategory(req.body).then(()=>{
    res.send("success")
  })
  
})



module.exports = router;
