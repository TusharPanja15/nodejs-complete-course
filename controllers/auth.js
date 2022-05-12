const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        isAuthenticated: false
    })
}

exports.postLogin = (req, res, next) => {
    User.findById("6279ffd1bc5f611177764c05")
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
                console.log(err)
                res.redirect('/')
            })
        })
        .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err)
        res.redirect('/')
    })
}