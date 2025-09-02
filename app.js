const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const authRoutes = require('./routes/auth');
const pickupRoutes = require('./routes/pickup');
const dotenv=require('dotenv');
dotenv.config();



const app=express();

app.use(express.json());
app.use(cors(
    {
        origin: '*'
    }
))

// app.use((req, res, next) => {
//     console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
//     next();
// });


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pickups', pickupRoutes);

app.get('/',(req,res)=>{
    res.send('Welcome to Scrap shera Backend');
});

const mongoDbUrl = process.env.MONGODB_URI;
mongoose.connect(mongoDbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log('Connected to MongoDB');
}).catch((err)=>{
    console.error('Error connecting to MongoDB', err);
});

app.listen(8080, '0.0.0.0', ()=>{
    console.log('Server started on port 8080');
});



