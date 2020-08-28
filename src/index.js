var Jimp = require("jimp");
var math = require("mathjs");
let { fast } = require("./fast");
let util = require("./util");
// getPOI("data/cup1.jpg", "dest/cup1", true);
// getPOI("data/cup2.jpg", "dest/cup2", true);
// getPOI("data/flower1.jpg", "dest/flower1", true);
// getPOI("data/flower2.jpg", "dest/flower2", true);
// getPOI("data/office.jpg", "dest/office", true);

// for (let i = 1; i <= 9; i++)
//   getPOI(`data/office/ref/${i}.jpg`, "dest/office/ref/" + i, true);

function getPOI(input, dest, debug) {
  util.getImg(input, dest, debug).then((img) =>
    fast(img, dest, debug).then((points) => {
      getPointIdentities(points);
    })
  );
}

util.getImg("data/flower2.jpg", "dest/flower3", true).then((img1) =>
  fast(img1, "dest/flower3", true).then((points) => {
    let p1 = getPointIdentities(img1, points);

    util.getImg("data/flower1.jpg", "dest/flower4", true).then((img2) =>
      fast(img2, "dest/flower4", true).then((points) => {
        let p2 = getPointIdentities(img2, points);

        let t = 1;
        let similar = p1.filter((p) =>
          p2.find((o) => Math.abs(p.id - o.id) < t)
        );
        // util.getImg("data/flower2.jpg", "dest/flower5", true).then((img) => {
        //   p1.forEach((point) =>
        //     img.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), point.x, point.y)
        //   );
        //   similar.forEach((point) => {
        //     img.setPixelColor(Jimp.rgbaToInt(0, 255, 0, 255), point.x, point.y);
        //   });
        //   img.write("dest/flower5/similar.jpg");
        // });

        new Jimp(
          img1.getWidth() * 2,
          img1.getHeight(),
          "black",
          (err, cross) => {
            cross.composite(img1, 0, 0);
            cross.composite(img2, img1.getWidth(), 0);
            p1.forEach((p1, index) => {
              let n = p2.sort(
                (a, b) => Math.abs(p1.id - a.id) - Math.abs(p1.id - b.id)
              )[0];
              if (Math.abs(p1.id - n.id) < t) {
                // console.log(
                //   `on index ${index} drawing a line from (${p1.x},${p1.y}) to (${n.x}, ${n.y})`
                // );
                if (index % 100 == 0)
                  line(cross, p1.x, p1.y, n.x + img1.getWidth(), n.y);
              }
            });
            // line(cross, 10, 10, 200, 100);
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
    // console.log(x1, y1);
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
        ), //TODO: calculate angle in each neighbour relative to 0(up)
      }))
      .filter((n) => n.dist > ignoreRadius && n.dist < neighbourhoodRadius),
  }));
  return points.map((p) => ({
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
      p.neighbours.length,
  }));
}

function sobel(img, org, callback, dest, debug) {
  img.clone((err, img) => {
    for (let x = 1; x < img.getWidth() - 1; x++) {
      for (let y = 1; y < img.getWidth() - 1; y++) {
        let gX = [
          [1, 2, 1],
          [0, 0, 0],
          [-1, -2 - 1],
        ];
        let gY = [
          [1, 0, -1],
          [2, 0, -2],
          [1, 0, -1],
        ];
        gX.forEach((val, xX) =>
          val.forEach(
            (strength, yY) =>
              (gX[xX][yY] *= getValue(img, x + (xX - 1), y + (yY - 1)))
          )
        );
        gY.forEach((val, xX) =>
          val.forEach(
            (strength, yY) =>
              (gY[xX][yY] *= getValue(img, x + (xX - 1), y + (yY - 1)))
          )
        );

        gXSum = gX.reduce(
          (acc, val) => (acc += val.reduce((acc, val) => (acc += val), 0)),
          0
        );
        gYSum = gY.reduce(
          (acc, val) => (acc += val.reduce((acc, val) => (acc += val), 0)),
          0
        );
        let strength =
          Math.min(Math.max(Math.abs(gXSum), Math.abs(gYSum)) / 140, 1) * 255;

        org.setPixelColor(
          Jimp.rgbaToInt(strength, strength, strength, 255),
          x,
          y
        );
      }
    }
    if (debug) org.write(dest + "/sobel.jpg");
    callback.apply(this, [org]);
  });
}

function harris(img, org, dest, debug) {
  let points = 0;
  img.clone((err, img) => {
    if (err) throw err;
    let rad = 1;
    for (let x = rad; x < img.getWidth() - rad; x++) {
      for (let y = rad; y < img.getHeight() - rad; y++) {
        let rT = 90000000;
        let cT = 50000;

        let eigs = math.eigs(getHarrisWindow(img, x, y));
        let l1 = eigs.values[0];
        let l2 = eigs.values[1];

        let r = l1 * l2 - 0.05 * Math.pow(l1 + l2, 2);
        // console.log([r, l1, l2, Math.abs(l1 - l2)])
        if (Math.abs(r) > rT) {
          //not flat
          if (Math.abs(l1 - l2) > cT) {
            // org.setPixelColour(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
            // org.setPixelColour(Jimp.rgbaToInt(0, 0, 200, 255), x, y);
            //edge
          } else {
            let strength = 255;
            org.setPixelColour(
              Jimp.rgbaToInt(strength, strength, strength, 255),
              x,
              y
            );
            points++;
            //corner
          }
        } else org.setPixelColour(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
      }
    }
    if (debug) org.write(dest + "/imp.jpg");
  });
  console.log(points + " poi found");
}
/**
 *
 * @param {Jimp} img
 * @param {number} x
 * @param {number} y
 */
function getHarrisWindow(img, x, y) {
  let m = [
    [0, 0],
    [0, 0],
  ];
  for (let xX = -1; xX <= 1; xX++) {
    for (let yY = -1; yY <= 1; yY++) {
      m[0][0] += Math.pow(getValue(img, x + xX, y), 2);
      m[0][1] += getValue(img, x + xX, y) * getValue(img, x, y + yY);
      m[1][0] += getValue(img, x + xX, y) * getValue(img, x, y + yY);
      m[1][1] += Math.pow(getValue(img, x, y + yY), 2);
    }
  }
  return m;
}

function getValue(img, x, y) {
  return Jimp.intToRGBA(img.getPixelColor(x, y)).r;
}
