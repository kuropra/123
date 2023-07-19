const express = require('express');
const app = express();

const fs = require("fs");
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');

const data = require('all.db');
const db = new data.Database({
    dataPath: "./data.json"
});

const adminRank = {
    "Developer": {
        "id": 1
    },
    "Access": {
        "id": 2
    }
};

const userRank = {

}

app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));
app.use(bodyParser.json({
    limit: '50mb',
    type: 'application/json'
}));

app.use(require("express-session")({
    secret: "asdfgjas0dasd",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");


function adminReq(req, res, next) {
    if (req.session.isAdmin) {
        return next();
    }
    render(req, res, "wrong_login.ejs", {
        message: "Sorry you don't have access"
    });
}

app.get('/', (req, res) => {
    res.redirect("/login");
});

app.get('/api/user/login', (req, res) => {
    res.send({
        status: 200
    })
});

function getAllUser() {
    var obj = db.get("user");
    var result = Object.keys(obj).map((key) => obj[key]);
    return result;
}

function getAllLicances() {
    var obj = db.get("licances");
    var result = Object.keys(obj).map((key) => key);
    return result;
}

function licanceCreate(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.get('/admin', adminReq, (req, res) => {
    render(req, res, 'admin.ejs', {
        admin: req.session.isAdmin,
        users: getAllUser(),
        licances: getAllLicances()
    });
});

app.get('/api/license/create_redirect', (req, res) => {
    var license = licanceCreate(10);

    let data = db.get(`licances.${license}`);
    if (data) return res.send({
        message: "Licance Found"
    });
    db.set(`licances.${license}`, true);
    res.status(200).send({
        license: license
    });
});

app.post('/api/licances/create', adminReq, (req, res) => {
    if (req.session.isAdmin == true) {
        let data = db.get(`licances.${req.body.createlicance}`);
        if (data) return res.send({
            message: "Licance Found"
        });
        db.set(`licances.${req.body.createlicance}`, true);
        let yourDate = new Date();
        res.redirect("/admin");
    }
});

app.post('/api/licances/remove', adminReq, (req, res) => {
    if (req.session.isAdmin == true) {
        let data = db.get(`licances.${req.body.removelicance}`);
        if (!data) return res.send({
            message: "Licance Not Found"
        });
        db.delete(`licances.${req.body.removelicance}`);
        let yourDate = new Date();
        res.redirect("/admin");
    }
});

app.post('/api/user/addtime', adminReq, (req, res) => {
    const Dates = new Date();
    if (req.session.isAdmin == true) {
        let data = db.get(`user.${req.body.newdayusername}`);
        if (!data) return res.send({
            message: "User Not Found"
        });
        if (adminRank[data.rank] && req.session.user.rank != "Developer") return render(req, res, "wrong_list.ejs", {
            message: "You Can't Change Time of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
        db.set(`user.${req.body.newdayusername}.expires`, Date.now() + (parseInt(req.body.newday) * 86400000));
        render(req, res, "list.ejs", {
            message: "You Can't Change Time of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
    }
});

app.post('/api/user/password', adminReq, (req, res) => {
    if (req.session.isAdmin == true) {
        let data = db.get(`user.${req.body.passusername}`);
        if (!data) return res.send({
            message: "User Not Found"
        });
        if (adminRank[data.rank] && req.session.user.rank != "Developer") return render(req, res, "wrong_list.ejs", {
            message: "You Can't Change Password of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
        db.set(`user.${req.body.passusername}.password`, req.body.passpassword);

        render(req, res, "list.ejs", {
            message: "You Can't Change Time of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
    }
});

app.post('/api/user/remove', adminReq, (req, res) => {
    if (req.session.isAdmin == true) {
        let data = db.get(`user.${req.body.removeusername}`);
        if (!data) return res.send({
            message: "User Not Found"
        });
        if (adminRank[data.rank] && req.session.user.rank != "Developer") return render(req, res, "wrong_list.ejs", {
            message: "You Can't Remove of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
        db.remove(`user.${req.body.removeusername}`);
        render(req, res, "list.ejs", {
            message: "You Can't Change Time of This User",
            admin: req.session.isAdmin,
            users: getAllUser(),
            licances: getAllLicances()
        });
    }
});

app.post('/api/user/create', adminReq, (req, res) => {
    const Dates = new Date();
    if (req.session.isAdmin == true) {
        let data = db.get(`user.${req.body.uusername}`);
        if (data) return res.send({
            message: "Username Already Exists"
        });
        let user = {
            username: req.body.uusername,
            password: req.body.upassword,
            rank: req.body.urank,
            expires: Date.now() + (parseInt(req.body.uday) * 86400000)
        }

        db.set(`user.${user.username}`, user);
        res.redirect("/admin");
    }
});

function formatDate(date, format) {
    const map = {
        mm: date.getMonth() + 1,
        dd: date.getDate(),
        yyyy: date.getFullYear()
    }

    return `${map.dd}\.${map.mm}\.${map.yyyy}`;
}
app.post("/gt/login", (req, res) => {
    let data = db.get(`user.${req.body.username}`);
    if (!data) return res.send({
        response: "failed",
        username: req.body.username,
        message: "username doesn't exit"
    });
    if (data.password != req.body.password) return res.send({
        response: "failed",
        username: req.body.username,
        message: "wrong password"
    });
    if (data.expires != false) {
        if (Date.now() > data.expires) return res.send({
            response: "failed",
            username: req.body.username,
            message: "expired"
        })
    }
    if (data.rank != "Developer") {
        if (!req.body.mac) res.send({
            response: "failed",
            username: req.body.username,
            message: "something went wrong"
        })
        if (data.mac) {
            if (req.body.mac != data.mac) return res.send({
                response: "failed",
                username: req.body.username,
                message: "1 license 1 device"
            })
        } else {
            db.set(`user.${req.body.username}.mac`, req.body.mac);
        }
    }
    return res.send({
        response: "success",
        username: req.body.username,
        message: "logged-in"
    })
});

app.post("/gt/register", (req, res) => {
    let data = db.get(`user.${req.body.username}`);
    if (data) return res.send({
        response: "failed",
        username: req.body.username,
        password: "NULL",
        message: "username already used"
    })
    if (!req.body.password) return res.send({
        response: "failed",
        username: req.body.username,
        password: "NULL",
        message: "input password"
    })
    if (!req.body.mac) return res.send({
        response: "failed",
        username: req.body.username,
        password: req.body.password,
        message: "something went wrong"
    })
    let licance = db.get(`licances.${req.body.license}`) || false;
    if (!licance) return res.send({
        response: "failed",
        username: req.body.username,
        password: req.body.password,
        message: "license not found"
    })
    let user = {
        username: req.body.username,
        password: req.body.password,
        mac: req.body.mac,
        licance: req.body.license,
        rank: "User",
        expires: Date.now() + 2592000000,
    }
    db.delete(`licances.${req.body.license}`);
    db.set(`user.${req.body.username}`, user);

    return res.send({
        response: "success",
        username: req.body.username,
        password: req.body.password,
        message: "registered"
    })
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});


app.get("/login", (req, res) => {
    render(req, res, 'login.ejs');
});

app.post('/login', (req, res) => {
    const Dates = new Date();
    let data = db.get(`user.${req.body.username}`);
    if (!data) return render(req, res, "wrong_login.ejs", {
        message: "Username Does't Exit"
    });
    if (data.password != req.body.password) return render(req, res, "wrong_login.ejs", {
        message: "Wrong Password"
    });
    if (data.expires != false) {
        if (Date.now() > data.expires) return render(req, res, "wrong_login.ejs", {
            message: "Account Expired"
        });
    }
    if (adminRank[data.rank]) req.session.isAdmin = true;
    req.session.user = {
        username: data.username,
        rank: data.rank,
        experies: data.expires
    };
    res.redirect("/admin");
});

app.post("/api/list_redirect", (req, res) => {
    render(req, res, "list.ejs", {
        admin: req.session.isAdmin,
        users: getAllUser(),
        licances: getAllLicances()
    })
});

const dataDir = path.resolve(`${process.cwd()}${path.sep}views`);
const templateDir = path.resolve(`${dataDir}${path.sep}${path.sep}`);
const render = async (req, res, template, data = {}) => {
    const baseData = {
        user: req.session.user || null,
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
};

app.listen(80, () => {
    console.log(`Example app listening on port 80!`)
});