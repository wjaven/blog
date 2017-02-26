var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, tags, post) {
  this.name = name;
  this.head = head;
  this.title = title;
  this.tags = tags;
  this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
  var date = new Date();
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + '-' + (date.getMonth() + 1),
    day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
    minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() +
        ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  }
  var post = {
    name: this.name,
    head: this.head,
    time: time,
    title: this.title,
    tags: this.tags,
    post: this.post,
    comments: [],
    reprint_info: {},
    pv: 0
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
      }, function(err) {
        mongodb.close();
        if (err) return callback(err);
        callback(null);
      });
    });
  });
}
Post.getAll = function(name, callback) {
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
Post.getTen = function(name, page, callback) {
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
      // 使用count返回特定查询文档数total
      collection.count(query, function(err, total){
        // 根据query查询对象，并跳过(page-1)*10个结果
        collection.find(query, {
          skip: (page - 1) * 10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function(err, docs) {
          mongodb.close();
          if (err) return callback(err);
          docs.forEach(function(doc) {
            doc.post = markdown.toHTML(doc.post);
          });
          callback(null, docs, total);
        });
      });
    });
  });
}
Post.getOne = function(name, day, title, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        name: name,
        'time.day': day,
        title: title
      }, function(err, doc) {
        if (err){
          mongodb.close();
          return callback(err);
        }
        if (doc) {
          // 每访问一次，pv增加1
          collection.update({
            name: name,
            'time.day': day,
            title: title
          }, {
            $inc: {pv: 1}
          }, function(err) {
            mongodb.close();
            if (err) return callback(err);
          });
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function(comment) {
            comment.content = markdown.toHTML(comment.content);
          });
          callback(null, doc);
        }
      });
    });
  });
}
Post.edit = function(name, day, title, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        name: name,
        'time.day': day,
        title: title
      }, function(err, doc) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, doc);
      });
    });
  });
}
Post.update = function(name, day, title, post, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.update({
        name: name,
        'time.day': day,
        title: title
      }, {
        $set: {post: post}
      }, function(err) {
        mongodb.close();
        if (err) return callback(err);
        callback(null);
      });
    });
  });
}
Post.remove = function(name, day, title, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // 查询要删除的文档
      collection.findOne({
        name: name,
        'time.day': day,
        title: title
      }, function(err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        // 如果有reprint_from 先保存reprint_from
        var reprint_from = '';
        if (doc.reprint_info.reprint_from) {
          reprint_from = doc.reprint_info.reprint_from;
        }
        if (reprint_from != '') {
          // 更新源文档reprint_to
          collection.update({
            name: reprint_from.name,
            'time.day': reprint_from.day,
            title: reprint_from.title
          }, {
            $pull: {
              'reprint_info.reprint_to': {
                name: name,
                'time.day': day,
                title: title
              }
            }
          }, function(err) {
            if (err) {
              mongodb.close();
              return callback(err);
            }
          });
        }
        // 删除转载来的文档所在文档
        collection.remove({
          name: name,
          'time.day': day,
          title: title
        }, {
          w: 1
        }, function(err) {
          mongodb.close();
          if (err) return callback(err);
          callback(null);
        });
      });
    });
  });
}
Post.getArchive = function(callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.find({},{
        name: 1,
        time: 1,
        title: 1
      }).sort({
        time: -1
      }).toArray(function(err, docs) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, docs);
      });
    });
  });
}
Post.getTags = function(callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // distinct 用来查找给定键的所有不同值
      collection.distinct('tags',function(err, docs) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, docs);
      });
    });
  });
}
Post.getTag = function(tag, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // 查询所有tags数组内包含tag的文档
      // 并返回只含有name, time, title组成的数组
      collection.find({
        tags: tag
      }, {
        name: 1,
        time: 1,
        title: 1
      }).sort({
        time: -1
      }).toArray(function(err, docs) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, docs);
      });
    });
  });
}
Post.search = function(keyword, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, 'i');
      collection.find({
        title: pattern
      }, {
        name: 1,
        time: 1,
        title: 1
      }).sort({
        time: -1
      }).toArray(function(err, docs) {
        mongodb.close();
        if (err) return callback(err);
        callback(null, docs);
      });
    });
  });
}
Post.reprint = function(reprint_from, reprint_to, callback) {
  mongodb.open(function(err, db) {
    if (err) return callback(err);
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // 找到被转载文章的源文档
      collection.findOne({
        name: reprint_from.name,
        'time.day': reprint_from.day,
        title: reprint_from.title
      }, function(err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        var date = new Date();
        var time = {
          date: date,
          year: date.getFullYear(),
          month: date.getFullYear() + '-' + (date.getMonth() + 1),
          day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
          minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() +
              ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }
        delete doc._id; // 删掉原来_id
        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : '[转载]' + doc.title;
        doc.comment = [];
        doc.reprint_info = {reprint_from: reprint_from};
        doc.pv = 0;
        // 更新源文档reprint_info的reprint_to
        collection.update({
          name: reprint_from.name,
          'time.day': reprint_from.day,
          title: reprint_from.title
        }, {
          $push: {
            'reprint_info.reprint_to': {
              name: doc.name,
              day: time.day,
              title: doc.title
            }
          }
        }, function(err) {
          if(err) {
            mongodb.close();
            return callback(err);
          }
        });
        // 将转载生成的富文本修改后写入，返回存储后文档
        collection.insert(doc, {
          safe: true
        }, function(err, post) {
          mongodb.close();
          if(err) return callback(err);
          callback(null, post.ops[0]);
        });
      });
    });
  });
}
