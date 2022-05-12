exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req
    //     .get('Cookie')
    //     .trim()
    //     .split('=')[1] == 'true';
    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        isAuthenticated: false
    })
}

exports.postLogin = (req, res, next) => {
    req.session.isLoggedIn = true;
    res.redirect('/')
}