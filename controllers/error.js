exports.get404 = (req, res, next) => {
    res.status(404).render('404', { 
        docTitle: "404 Page not Found!!!",
        path: "/404",
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', { 
        docTitle: "500 Page not Found!!!",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn
    });
};