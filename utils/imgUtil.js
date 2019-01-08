var fs = require('fs')
  , gm = require('gm').subClass({imageMagick: true});

// resize and remove EXIF profile data
function imgUtil() {
  var n = [],l=[],t=[];
  for(var i=0; i<4;i++) {
    var lf = 28*i;
    n.push(parseInt(Math.random()*10))
    l.push(parseInt(Math.random()*20+lf))
    var nt = parseInt(Math.random()*30)+16;
    t.push(nt>50?40:nt)
  }
  console.log(n);
  console.log(l);
  console.log(t);
  gm(120, 40, '#ffffffff')
  .fontSize(30)
  .drawText(l[0], t[0], n[0])
  .drawText(l[1], t[1], n[1])
  .drawText(l[2], t[2], n[2])
  .drawText(l[3], t[3], n[3])
  //.swirl(40)// 漩涡
  //.spread(0.5)//扩散（粒子化）
  //.paint(2) //绘画
  //.noise("laplacian")//拉普拉斯
  //.implode(0.2)//向心聚爆
  //.charcoal()//碳化
  .write('resize.jpg', function (err) {
    console.log(err)
    if (!err) console.log('done');
  });
}

module.exports = imgUtil;
