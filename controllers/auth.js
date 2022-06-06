const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "1e5f44482a41b2",
        pass: "7eba99731157ac"
    }
})

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        docTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('auth/login', {
                docTitle: 'Login',
                path: '/login',
                errorMessage: errors.array()[0].msg,
                oldInput: {
                    email: email,
                    password: password
                },
                validationErrors: errors.array()
            })
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res
                    .status(422)
                    .render('auth/login', {
                        docTitle: 'Login',
                        path: '/login',
                        errorMessage: errors.array()[0].msg,
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    })
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err)
                            res.redirect('/')
                        })
                    }
                    return res
                        .status(422)
                        .render('auth/login', {
                            docTitle: 'Login',
                            path: '/login',
                            errorMessage: "Invalid email or password.",
                            oldInput: {
                                email: email,
                                password: password
                            },
                            validationErrors: []
                        })
                })
                .catch(err => {
                    console.log(err)
                    res.redirect('/login')
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('auth/signup', {
                path: '/signup',
                docTitle: 'Signup',
                errorMessage: errors.array()[0].msg,
                oldInput: {
                    email: email,
                    password: password,
                    confirmPassword: req.body.confirmPassword
                },
                validationErrors: errors.array()
            });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return user.save()
        })
        .then(result => {
            res.redirect('/login')
            return transporter.sendMail({
                to: email,
                from: 'shop@node-complete.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up</h1>'
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err)
        res.redirect('/')
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        docTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message,
        validationErrors: [],
        oldInput: ''
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }

        const token = buffer.toString('hex')
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res
                .status(422)
                .render('auth/reset', {
                    docTitle: 'Reset Password',
                    path: '/reset',
                    errorMessage: errors.array()[0].msg,
                    validationErrors: errors.array(),
                    oldInput: req.body.email
                })
        }

        User
            .findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No aacount with that email found.')
                    return res.redirect('/reset')
                }
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save()
            })
            .then(result => {
                res.redirect('/')
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@node-complete.com',
                    subject: 'Password reset',
                    html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="${process.env.ROOT_URL}/reset/${token}">link</a> to set a new password.</p>
                    `
                })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            })
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User
        .findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                docTitle: 'New Password',
                path: '/new-password',
                errorMessage: message,
                validationErrors: [],
                oldInput: '',
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    const errors = validationResult(req);
    let resetUser;

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('auth/new-password', {
                docTitle: 'New Password',
                path: '/new-password',
                errorMessage: errors.array()[0].msg,
                validationErrors: errors.array(),
                oldInput: req.body.email,
                userId: userId,
                passwordToken: passwordToken
            })
    }

    User
        .findOne({
            resetToken: passwordToken,
            resetTokenExpiration: { $gt: Date.now() },
            _id: userId
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save()
        })
        .then(result => {
            res.redirect('/login')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}