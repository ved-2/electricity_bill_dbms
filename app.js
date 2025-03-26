const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const session = require('express-session');

// Import models
const Customer = require('./models/customers');
const Meter = require('./models/meters');
const Consumption = require('./models/consumption');
const Bill = require('./models/bills');

const MONGO_URL = "mongodb://127.0.0.1:27017/utility_billing";

// Connect to MongoDB
main()
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((err) => {
        console.error('Could not connect to MongoDB', err)
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

// Configure Express
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Routes

// Home route
app.get('/', (req, res) => {
    res.render("login.ejs", { error: null });
});

// Customer routes
app.get("/customers", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const customers = await Customer.find({});
    res.render("customers/index.ejs", { customers });
});

app.get("/customers/new", (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    res.render("customers/new.ejs");
});

app.post("/customers", async (req, res) => {
    try {
        const newCustomer = new Customer(req.body.customer);
        const savedCustomer = await newCustomer.save();
        console.log('Saved Customer:', savedCustomer);
        res.redirect("/customers");
    } catch (err) {
        console.error('Customer creation error:', err);
        res.render("customers/new.ejs", { error: err.message });
    }
});

// Meter routes
app.get("/meters", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const meters = await Meter.find({}).populate('customerId');
    res.render("meters/index.ejs", { meters });
});

app.get("/meters/new", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const customers = await Customer.find({});
    res.render("meters/new.ejs", { customers });
});

app.post("/meters", async (req, res) => {
    try {
        const newMeter = new Meter(req.body.meter);
        await newMeter.save();
        res.redirect("/meters");
    } catch (err) {
        res.render("meters/new.ejs", { error: err.message });
    }
});

// Consumption routes
app.get("/consumption", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const consumptions = await Consumption.find({}).populate('meterId');
    res.render("consumption/index.ejs", { consumptions });
});

app.get("/consumption/new", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const meters = await Meter.find({}).populate('customerId');
    res.render("consumption/new.ejs", { meters });
});

app.post("/consumption", async (req, res) => {
    try {
        const newConsumption = new Consumption(req.body.consumption);
        await newConsumption.save();
        res.redirect("/consumption");
    } catch (err) {
        res.render("consumption/new.ejs", { error: err.message });
    }
});

// Bill routes
app.get("/bills", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const bills = await Bill.find({}).populate('customer');
    res.render("bills/index.ejs", { bills });
});

app.get("/bills/new", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const customers = await Customer.find({});
    res.render("bills/new.ejs", { customers });
});

app.post("/bills", async (req, res) => {
    try {
        const newBill = new Bill(req.body.bill);
        await newBill.save();
        res.redirect("/bills");
    } catch (err) {
        res.render("bills/new.ejs", { error: err.message });
    }
});

// Authentication routes
app.get('/login', (req, res) => {
    res.render('login.ejs', { error: null });
});

app.post('/login/admin', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        return res.redirect('/dashboard');
    }
    
    res.render('login.ejs', { error: 'Invalid admin credentials' });
});

// Dashboard route
app.get("/dashboard", async (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalMeters = await Meter.countDocuments();
        const totalBills = await Bill.countDocuments();
        
        const recentBills = await Bill.find()
            .populate('customer')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentConsumptions = await Consumption.find()
            .populate('meterId')
            .sort({ readingDate: -1 })
            .limit(5);

        res.render("dashboard.ejs", {
            stats: {
                totalCustomers,
                totalMeters,
                totalBills,
                recentBills,
                recentConsumptions
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send("Error loading dashboard");
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Customer login route
app.post('/login/customer', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password });

        const customer = await Customer.findOne({ email });
        console.log('Found customer:', customer);

        if (!customer) {
            console.log('No customer found with email:', email);
            return res.render('login', { error: 'Invalid email or password' });
        }
        
        console.log('Comparing:', { 
            password, 
            contactNumber: customer.contactNumber 
        });

        if (password === customer.contactNumber) {
            req.session.customerId = customer._id;
            return res.redirect('/customer/dashboard');
        }
        
        console.log('Password mismatch');
        res.render('login', { error: 'Invalid email or password' });
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred' });
    }
});

// Customer dashboard route
app.get('/customer/dashboard', async (req, res) => {
    if (!req.session.customerId) {
        return res.redirect('/login');
    }
    
    try {
        const customer = await Customer.findById(req.session.customerId);
        const bills = await Bill.find({ customer: req.session.customerId })
            .sort({ issueDate: -1 });
        const meters = await Meter.find({ customerId: req.session.customerId });
        const consumption = await Consumption.find({
            meterId: { $in: meters.map(m => m._id) }
        })
        .populate('meterId')
        .sort({ readingDate: -1 })
        .limit(5);

        res.render('customer/dashboard', {
            customer,
            bills,
            meters,
            consumption
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// View individual bill
app.get('/customer/bills/:id', async (req, res) => {
    if (!req.session.customerId) {
        return res.redirect('/login');
    }

    try {
        const bill = await Bill.findOne({
            _id: req.params.id,
            customer: req.session.customerId
        }).populate('customer');

        if (!bill) {
            return res.redirect('/customer/dashboard');
        }

        res.render('customer/bill-detail', { bill });
    } catch (error) {
        res.redirect('/customer/dashboard');
    }
});

// Start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});
