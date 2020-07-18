const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const PropertySchema = new mongoose.Schema({
  title: String,
  amount:String,
  address:String,
  image:String,
  owner:String
});

const Property = mongoose.model('Property', PropertySchema);


const UserSchema = new mongoose.Schema({
  firstName:String,
  lastName:String,
  email:String,
  phoneNumber:String,
  password:String
})

const User = mongoose.model('User',UserSchema)

const uri = "mongodb+srv://swish:YecAODJ9MsgdMq1Z@utilappcluster.l8ct1.gcp.mongodb.net/liveizy?retryWrites=true&w=majority";
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology:true});
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Db is connected")
});

const PORT = process.env.PORT


const verifyToken = (req,res,next)=>{

  const bearerHeader = req.headers['authorization']
  if(typeof bearerHeader !== 'undefined'){
    const bearerToken = bearerHeader.split(" ")[1]
    req.token = bearerToken
    next()
  }else{
    res.json({message:"Invalid access token", status:false})
  }
}

app.get('/',(req,res)=>{
  res.send(`<div>
    <p>Use the following endpoint for what they describes</p>
    <p>Login:/api/login</p>
  </div>`)
})

// GET: all property route
app.get('/api/posts', verifyToken, async (req,res)=>{
   
  jwt.verify(req.token, 'liveizy', async function(err, decoded) {
    if(err){
      res.json({message:"Invalid access token",status:false})
    }
   const result = await Property.find({owner:decoded._id}).then(r=>r).catch()
    res.json({data:result})
  });
})

// POST: property route
app.post('/api/add', verifyToken,function (req, res) {

  jwt.verify(req.token, 'liveizy', async function(err, decoded) {

    if(err){
      res.json({message:"Invalid token",status:false})
    }
    const body = req.body
  
    if(body.title && body.amount && body.address && body.image){
      const p = new Property({title:body.title,amount:body.amount,address:body.address,image:body.image,owner:decoded._id})
    
      const r = p.save().then(r=>r)
    
      if(r){
       res.json({message:"Property Successfully added",status:true})
      }else{
        res.json({message:"There was an error. Try again later",status:false})
       
      }
    }else{
      res.json({message:"You cannot submit uncompleted form",status:false})
    }
      
    })

  })





app.post('/api/login', async (req,res)=>{

  const email = req.body.email
  const password = req.body.password
    if(email && password){

    const result = await  User.findOne({email}).then((r)=>r)
      
    if(result){
      const match = await bcrypt.compare(password, result.password);
   
      if(match){
        var token = jwt.sign({ result }, 'liveizy')
        res.json({message:"Success", status:true, token})
      }
   
    }else{
      res.json({ message:"Invalid email or password",status:false })
    }
    }else{
      res.json({ message:"Email or password cannot be empty",status:false })
    }
  
    })

// POST: Register a new user
app.post('/api/register', async (req,res)=>{
  let response

  const body = req.body
  if(body.firstName && body.lastName && body.email && body.phoneNumber && body.password){
    const hash = await bcrypt.hash(body.password, 10).then(h=>h);

    const user = await new User({firstName:body.firstName,lastName:body.lastName,email:body.email,password:hash})
    const count = await User.find({email:body.email}).then(r=>r)

    if(count.length == 0){
      const res = await user.save().then(r=>r)
    if(res){
      response = {message:"Account successfully created", status:true}
    }else{
      response = {message:"There was an issue creating your account. Try again later", status:false}
    }
    }else{
      response = {message:"The email you entered is already in use", status:false}
    }
    
  }else{
    response = {message:"Some fields are empty", status:false}
  }

  res.json({data:response})
})



// listen for requests
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

