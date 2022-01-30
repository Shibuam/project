var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var userHelper=require('../helpers/userHelper')
var adminHelper=require('../helpers/adminHelper');
const async = require('hbs/lib/async');
const { localsAsTemplateData } = require('hbs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/login')
});
router.get('/home',(req,res,next)=>{
  let admin=req.session.admin
res.render('admin/home',{admin:true,admin})
})

router.get('/login',(req,res,next)=>{
res.render('admin/login')
})       
router.post('/login',(req,res,next)=>{
 adminHelper.adminLogin().then((data)=>{
   let adminData=data
 if(adminData.name==req.body.name&&adminData.password==req.body.password){
   req.session.admin=data.name
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

  
  adminHelper.viewCategory().then((category)=>{
    adminHelper.Subcategory().then((Subcategory)=>{
      
  res.render('admin/AddProduct',{admin:true,category,Subcategory})
})
})
})
router.get('/viewProducts',(req,res,next)=>{
 
  adminHelper.viewProducts().then((products)=>{
    
    res.render('admin/viewProducts',{products,admin:true})
  })
})
 

router.post('/addProducts',(req,res,next)=>{
  req.body.mrp = parseInt(req.body.mrp)
 
  adminHelper.addProduct(req.body).then((id)=>{
  
    let image = req.files.image1;
        let image2= req.files.image2;
    let image3 = req.files.image3;
    let image4 = req.files.image4;
   
    id=id.insertedId;
    image.mv('./public/images/proImage/'+id+'image.jpg',(err)=>{
if(!err){
  image2.mv('./public/images/proImage/'+id+'image2.jpg',(err)=>{
    if(!err){
      image3.mv('./public/images/proImage/'+id+'image3.jpg',(err)=>{
        if(!err){
          image4.mv('./public/images/proImage/'+id+'image4.jpg',(err)=>{
            if(!err){
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
router.get('/editProduct/',async(req,res,next)=>{
 
 let product =await adminHelper.editProducts(req.query.id)

  
  res.render('admin/editProduct',{product,admin:true})
  });


  router.post('/editProducts/:id',(req,res,next)=>{
    req.body.mrp = parseInt(req.body.mrp)
    adminHelper.updateProduct(req.params.id,req.body).then((id)=>{
              if(req.files.image){
        let image=req.files.image
        image.mv('./public/images/proImage/'+req.params.id+'image.jpg')
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

   let Subcategory=req.session.Subcategory
   
   adminHelper.viewCategory().then((category)=>{

  res.render('admin/addEdit-category',{admin:true,category,Subcategory})
})
})
//})
router.post('/addCategory',(req,res,next)=>{
  
  adminHelper.addCategory(req.body).then(()=>{
    res.redirect('/admin/addEdit-category') 
  })
  
})

router.post('/addSubCategory',(req,res,next)=>{
  
      adminHelper.addingSubCategory(req.body)
    res.redirect('/admin/addEdit-category')
  })

router.get('/deleteSubCategory/:id',(req,res,next)=>{
  let id=req.params.id

    adminHelper.deleteSubCategory(id).then((data)=>{
     
    res.redirect('/admin/addEdit-category')
    })
  })

router.get('/deleteCategory/:id',(req,res,next)=>{
  let id=req.params.id
    adminHelper.deleteCategory(id).then((data)=>{
    res.redirect('/admin/addEdit-category')
  })
})

router.get('/viewSubCategory/:category',(req,res,next)=>{
  let id=req.params.category
 
  adminHelper.viewSubCategory(id).then((data)=>{
    req.session.Subcategory=data

    res.redirect('/admin/addEdit-category')
  })
})
router.get('/logout',(req,res,next)=>{
  req.session.admin=null
  res.redirect('/admin')
})
router.get('/orderManage',async(req,res,next)=>{
 let orderList=await adminHelper.orderMng()
 console.log(orderList)
 res.render('admin/orderManagement',{orderList,admin:true})
})
router.get('/bannerManagement',(req,res,next)=>{
  res.render('admin/bannerManage',{admin:true})
})
router.post('/addBanners',(req,res,next)=>{




   adminHelper.addBanner(req.body).then((bannerId)=>{
console.log(bannerId)
 
   let image = req.files.image;
   let image2= req.files.image2;
let image3 = req.files.image3;
let image4 = req.files.image4;
let image5= req.files.image5;
let image6 = req.files.image6;
id=bannerId. insertedId
console.log(id)
image.mv('./public/bannerImage/'+id+'image.jpg',(err)=>{
if(!err){
image2.mv('./public/bannerImage/'+id+'image2.jpg',(err)=>{
if(!err){
  image3.mv('./public/bannerImage/'+id+'image3.jpg',(err)=>{
    if(!err){
     
      image4.mv('./public/bannerImage/'+id+'image4.jpg',(err)=>{
  if(!err){
    image5.mv('./public/bannerImage/'+id+'image5.jpg',(err)=>{
      if(!err){
        image6.mv('./public/bannerImage/'+id+'image6.jpg',(err)=>{
          if(!err){

                      res.redirect('/admin/bannerManagement')
          }
        })
      }
    })
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


module.exports = router;
