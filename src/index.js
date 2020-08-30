var Jimp = require("jimp");
var math = require("mathjs");
let { fast } = require("./fast");
let { brief } = require("./brief");
let util = require("./util");

util.getImg("data/office/ref/1.jpg", "dest/cup1", false).then((img1) =>
  fast(img1.img, "dest/flower3", false)
    .then((points) => brief(img1.img, points))
    .then((descriptors1) => {
      util.getImg("data/office/ref/2.jpg", "dest/flower4", false).then((img2) =>
        fast(img2.img, "dest/flower4", false)
          .then((points) => brief(img2.img, points))
          .then((descriptors2) => {
            new Jimp(
              img1.img.getWidth() * 2,
              img1.img.getHeight(),
              "black",
              (err, cross) => {
                cross.composite(img1.org, 0, 0);
                cross.composite(img2.org, img1.org.getWidth(), 0);
                const match = (a, b) =>
                  util.bitCount(util.bitAnd(a.feature, b.feature));
                let matches = descriptors1
                  .map((desc1) => {
                    let desc2 = descriptors2.sort(
                      (a, b) => match(desc1, b) - match(desc1, a)
                    )[0];
                    return { desc1, desc2 };
                  })
                  .sort(
                    (a, b) => match(b.desc1, b.desc2) - match(a.desc1, a.desc2)
                  );
                // .slice(0, 20);

                console.log(
                  matches.map((match) => ({
                    p1: match.desc1.keypoint,
                    p2: match.desc2.keypoint,
                    a: util.printFeature(match.desc1.feature),
                    b: util.printFeature(match.desc2.feature),
                    ac: util.bitCount(match.desc1.feature),
                    bc: util.bitCount(match.desc2.feature),
                    count: util.bitCount(
                      util.bitAnd(match.desc1.feature, match.desc2.feature)
                    ),
                  }))
                );
                matches.forEach((match) => {
                  draw_line(
                    cross,
                    match.desc1.keypoint[0],
                    match.desc1.keypoint[1],
                    match.desc2.keypoint[0] + img1.org.getWidth(),
                    match.desc2.keypoint[1]
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
  console.log({ dX, dY });
  while (Math.floor(x1) !== x2 || Math.floor(y1) !== y2) {
    // console.log({ x1, x2, y1, y2 });
    img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x1, y1);
    x1 += dX;
    y1 += dY;
  }
}
//Stolen code https://medium.com/@js_tut/how-to-code-your-first-algorithm-draw-a-line-ca121f9a1395
let draw_line = (img, x1, y1, x2, y2) => {
  // Iterators, counters required by algorithm
  let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
  // Calculate line deltas
  dx = x2 - x1;
  dy = y2 - y1;
  // Create a positive copy of deltas (makes iterating easier)
  dx1 = Math.abs(dx);
  dy1 = Math.abs(dy);
  // Calculate error intervals for both axis
  px = 2 * dy1 - dx1;
  py = 2 * dx1 - dy1;
  // The line is X-axis dominant
  if (dy1 <= dx1) {
    // Line is drawn left to right
    if (dx >= 0) {
      x = x1;
      y = y1;
      xe = x2;
    } else {
      // Line is drawn right to left (swap ends)
      x = x2;
      y = y2;
      xe = x1;
    }

    img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x, y); // Draw first pixel
    // Rasterize the line
    for (i = 0; x < xe; i++) {
      x = x + 1;
      // Deal with octants...
      if (px < 0) {
        px = px + 2 * dy1;
      } else {
        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
          y = y + 1;
        } else {
          y = y - 1;
        }
        px = px + 2 * (dy1 - dx1);
      }
      // Draw pixel from line span at
      // currently rasterized position
      img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x, y);
    }
  } else {
    // The line is Y-axis dominant
    // Line is drawn bottom to top
    if (dy >= 0) {
      x = x1;
      y = y1;
      ye = y2;
    } else {
      // Line is drawn top to bottom
      x = x2;
      y = y2;
      ye = y1;
    }
    img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x, y); // Draw first pixel
    // Rasterize the line
    for (i = 0; y < ye; i++) {
      y = y + 1;
      // Deal with octants...
      if (py <= 0) {
        py = py + 2 * dx1;
      } else {
        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
          x = x + 1;
        } else {
          x = x - 1;
        }
        py = py + 2 * (dx1 - dy1);
      }
      // Draw pixel from line span at
      // currently rasterized position
      img.setPixelColor(Jimp.rgbaToInt(0, 0, 255, 255), x, y);
    }
  }
};

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
