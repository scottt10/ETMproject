const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const mongoSanitize = require('mongo-sanitize');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { mongo } = require('mongoose');

const secret = 'mys3cret@f0reTm'

router.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false }
    
}));

router.use(cookieParser());

router.use((req, res, next) => {
    res.locals.isLoggedIn = req.cookies.token ? true : false;
    next();
})


// user login, router and middleware


function isAlreadyLoggedin(req, res, next) {
    // console.log(req.route);
    // Accessing the token cookie
    const token = req.cookies.token;
    if (token) {
        console.log('Token found')
        // decode the role of the user
        const decoded = jwt.verify(token, secret);
        console.log(decoded)
        if (decoded.role === 'admin') {
            return res.redirect('admin');
        } else if (decoded.role === 'user') {
            return res.redirect('dashboard');
        }
    }
    next(); // Proceed to the next middleware/route handler
}


function isUser(req, res, next) {
    const token = req.cookies.token;
    if (token) {
            return next();
    }
    return res.status(403).send('Unauthorized Access');
}


router.get('/', (req, res) => {
    res.render('index');
});


router.get("/login", isAlreadyLoggedin, (req, res) => {
    res.render('login');

});

router.get('/profile', isUser, (req, res) => {
    let token = req.cookies.token;
    let decoded = jwt.verify(token, secret);
    let name = decoded.username;
    res.status(200).json({
        name: name,
        role: 'user'
    });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            username,
            password
        }).exec();

        console.log(user)

        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        const token = jwt.sign({ username, role: user.role }, secret);
        admin/admin/
        console.log(token)
        const options = {
            maxAge: 1000 * 60 * 30000, // 15 minutes
            httpOnly: false, // The cookie is only accessible by the web server
        };

        // req.session.token = token;
        res.cookie('token', token, options);

        return res.redirect('dashboard');
       
        
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error signing the token');
    }
});


router.get('/dashboard',isUser, (req, res) => {
    res.render('dashboard');
});

router.post('/submit', isUser, async (req, res) => {
    const { name, price, description } = req.body;
    const product = new Product({
        name,
        price,
        description
    });

    try {
        await product.save();
        res.status(200).send('Admin will review it soon');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product');
    }
});


router.get('/profile', isUser, (req, res) => {
    let token = req.cookies.token;
    let decoded = jwt.verify(token, secret);
    let name = decoded.username;
    res.status(200).json({
        name: name,
        role: 'user'
    });
});

router.get('/product', isUser, async (req, res) => {
    let products = await Product.find({}).exec();
    // Filter products to only include those with a status of true
    products = products.filter(product => product.status === true);

    res.render('product', { products });
});

router.get('/product/:name', isUser, async (req, res) => {
    const name = req.params.name;
    const product = await Product.findOne({ name }).exec();
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product-detail', { product });
});


// admin login, router and middleware

function isAdmin(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.verify(token, secret);
        if (decoded.role === 'admin') {
            return next();
        }
    }
    return res.status(403).send('404');
}


function isAlreadyLoggedinAdmin(req, res, next){
    const token = req.cookies.token;
    if(token){
        return res.redirect('admin');
    }
    else{
        next();
    }
}

function isLogoutAdmin(req, res, next){
    const token = req.cookies.token;
    if(token){
        const decoded = jwt.verify(token, secret);
        if(decoded.role === 'admin'){
            return next();
        }
    }
    return res.status(403).json({message: "You are not authorized to access this page"});
}

router.get("/backend",  (req, res) => {
    res.render('backend');

});

router.post('/backend', async (req, res) => {
    let { username, password } = req.body;
    // Sanitize username and password
    username = username;
    password = password;

    try {
        const admin = await Admin.findOne({
            username,
            password
        });

        if (!admin) {
            return res.status(400).send('Invalid username or password');
        }

        console.log(admin);

        const session = jwt.sign({ username, role: admin.role }, secret);

        console.log(session);
        const options = {
            maxAge: 1000 * 60 * 15, 
            httpOnly: false, 
        };

        // req.session.token = token;
        res.cookie('token', session, options);

        res.status(200).redirect('admin');
    } 
    catch (error) {
        return res.status(500).send('Internal server error');
    }
});

router.post('/update-product-status', isAdmin, async (req, res) => {
    const { productId } = req.body;
    
    try {
        const product = await Product.findById(productId).exec();
        if (!product) {
            return res.status(404).send('Product not found');
        }
        product.status = true;
        await product.save();
        res.status(200).send('Product status updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product status');
    }
});

router.get('/admin', isAdmin, async (req, res) => {
    let products = await Product.find({}).exec();
    return res.render('admin',{products});
}
);


router.get('/logout', (req,res) => {
    if(!req.cookies.token) {
        return res.status(400).send('User is not logged in');
    }
    res.clearCookie('token');
    res.redirect('/');
}
);
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});
router.get('*', (req, res) => {
    res.render('404')
}
);
module.exports = router;
