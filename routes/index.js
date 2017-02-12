var express = require('express');
var router = express.Router();
var crypto = require('crypto'); //生成散列值加密密码
var User = require('../models/user');

/* GET home page. */
//router.get('/', function(req, res, next) {
//res.render('index', { title: 'Express' });
//});

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index', {title: '主页'});
  });
  app.get('/reg', function(req, res) {
    res.render('reg', {title: '注册'});
  });
  app.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致！');
      return res.redirect('./reg');
    }
    var md5 = crypto.createHash('md5'),
        password = md5.update(password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.name.email
    });
    User.get(newUser.name, function(err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户名已存在！');
        return res.redirect('./reg');
      }
      newUser.save(function(err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg');
        }
        req.session.user = user;
        req.flash('success', '注册成功！');
        res.redirect('/');
      });
    });
  });
  app.get('/login', function(req, res) {
    res.render('login', {title: '登录'});
  });
  app.post('/login', function(req, res) {
  });
  app.get('/post', function(req, res) {
    res.render('index', {title: '发表'});
  });
  app.post('/post', function(req, res) {
  });
  app.get('/logout', function(req, res) {
  });
};
