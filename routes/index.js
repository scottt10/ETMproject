const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const secret = 'mys3cret@f0reTm'

router.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

router.use(cookieParser());

router.use((req, res, next) => {
    res.locals.isLoggedIn = req.cookies.token ? true : false;
    next();
})

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
        const decoded = jwt.verify(token, secret);
        if (decoded.role === 'user') {
            return next();
        }
    }
    return res.status(403).send('404');
}

router.get('/', (req, res) => {
    // Example condition to check if the user is logged in
    // This should be replaced with your actual logic, e.g., checking a session or a token
    res.render('index');
});

router.get("/login", isAlreadyLoggedin, (req, res) => {
    res.render('login');

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

        console.log(token)
        const options = {
            maxAge: 1000 * 60 * 30000, // 15 minutes
            httpOnly: true, // The cookie is only accessible by the web server
        };

        // req.session.token = token;
        res.cookie('token', token, options);

        if (user.role === 'admin') {
            return res.redirect('admin');
        } else {
            return res.redirect('dashboard');
        }
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

router.get('/admin', (req, res) => {
    return res.render('admin');
}
);

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
