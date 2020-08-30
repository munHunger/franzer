var Jimp = require("jimp");
var math = require("mathjs");
let { fast } = require("./fast");
let util = require("./util");

util.getImg("data/flower2.jpg", "dest/flower3", true).then((img1) =>
  fast(img1, "dest/flower3", true).then((points) => {
    let p1 = getPointIdentities(img1, points);

    util.getImg("data/flower1.jpg", "dest/flower4", true).then((img2) =>
      fast(img2, "dest/flower4", true).then((points) => {
        let p2 = getPointIdentities(img2, points);

        let t = 1;

        new Jimp(
          img1.getWidth() * 2,
          img1.getHeight(),
          "black",
          (err, cross) => {
            cross.composite(img1, 0, 0);
            cross.composite(img2, img1.getWidth(), 0);
            p1.map((p1) => {
              let n = p2.sort(
                (a, b) => Math.abs(p1.id - a.id) - Math.abs(p1.id - b.id)
              )[0];
              return { a: p1, b: n, dist: Math.abs(p1.id - n.id) };
            })
              .filter((m) => m.dist < t)
              .sort((a, b) => a.dist - b.dist)
              .slice(0, 10)
              .forEach((match) => {
                console.log(`${match.dist}: ${match.a.id}, ${match.b.id}`);
                console.log(match);
                line(
                  cross,
                  match.a.x,
                  match.a.y,
                  match.b.x + img1.getWidth(),
                  match.b.y
                );
              });
            cross.write("dest/cross.jpg");
          }
        );
      })
    );
  })
);

function line(img, x1, y1, x2, y2) {
  let dX = x2 - x1;
  let dY = y2 - y1;
  let max = Math.max(Math.abs(dX), Math.abs(dY));
  dX /= max;
  dY /= max;
  while (Math.floor(x1) !== x2 && Math.floor(y1) !== y2) {
    img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x1, y1);
    x1 += dX;
    y1 += dY;
  }
}

function getPointIdentities(img, points) {
  let ignoreRadius = 5;
  let neighbourhoodRadius = 15;
  points = points.map((point) => ({
    x: point[0],
    y: point[1],
    neighbours: points
      .map((neighbour) => ({
        x: neighbour[0],
        y: neighbour[1],
        dist: Math.sqrt(
          Math.pow(Math.abs(point[0] - neighbour[0]), 2) +
            Math.pow(Math.abs(point[1] - neighbour[1]), 2)
        ),
        angle: Math.atan((point[0] - neighbour[0]) / (point[1] - neighbour[1])),
      }))
      .filter((n) => n.dist > ignoreRadius && n.dist < neighbourhoodRadius),
  }));
  return points
    .filter((p) => p.neighbours.length > 0)
    .map((p) => ({
      ...p,
      id:
        ([
          [0, -3],
          [3, 0],
          [0, 3],
          [-3, 0],
        ]
          .map((point) => util.getValue(img, p.x + point[0], p.y + point[1]))
          .reduce((acc, val) => (acc += val), 0) +
          p.neighbours.reduce((acc, val) => (acc += val.dist), 0)) *
        Math.pow(
          p.neighbours.reduce((acc, val) => (acc += val.angle), 0),
          2
        ) *
        p.neighbours.length,
    }));
}
