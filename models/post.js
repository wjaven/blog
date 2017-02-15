var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post) {
  this.name = name;
  this.title = title;
  this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
  var data = new Date();
  var time = {
    data: data,
    year: data.getFullYear(),
    month: data.getFullYear() + '-' + (data.getMonth() + 1),
    day: data.getFullYear() + '-' + (data.getMonth() + 1) + '-' + data.getDate(),
    minute: data.getFullYear() + '-' + (data.getMonth() + 1) + '-' + data.getDate() +
        ' ' + data.getHours() + ':' + (data.getMinutes() < 10 ? '0' + data.getMinutes() : data.getMinutes())
  }
  var post = {
    name: this.name,
    title: this.title,
    post: this.post,
    time: time
  };
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.insert(post, {
        safe: true
      }, function(err, user) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, user[0]);
      });
    });
  });
}
Post.get = function (name, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      collection.find(query).sort({
        time: -1
      }).toArray(function(err, docs) {
        mongodb.close();
        if (err) return callback(err);
        docs.forEach(function(doc) {
          doc.post = markdown.toHTML(doc.post);
        });
        callback(null, docs); //以数组形式返回查询结果
      });
    });
  });
}
