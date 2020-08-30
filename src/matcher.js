var Jimp = require("jimp");
let { fast } = require("./fast");
let { brief } = require("./brief");
let util = require("./util");

function match(a, b, out) {
  return new Promise((resolve, reject) => {
    util.getImg(a).then((img1) =>
      fast(img1.img)
        .then((points) => brief(img1.img, points))
        .then((descriptors1) => {
          util.getImg(b).then((img2) =>
            fast(img2.img)
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
                        (a, b) =>
                          match(b.desc1, b.desc2) - match(a.desc1, a.desc2)
                      )
                      .filter(
                        (m) =>
                          util.bitCount(m.desc1.feature) -
                            match(m.desc1, m.desc2) <
                          3
                      );

                    // console.log(
                    //   matches.map((match) => ({
                    //     p1: match.desc1.keypoint,
                    //     p2: match.desc2.keypoint,
                    //     a: util.printFeature(match.desc1.feature),
                    //     b: util.printFeature(match.desc2.feature),
                    //     ac: util.bitCount(match.desc1.feature),
                    //     bc: util.bitCount(match.desc2.feature),
                    //     count: util.bitCount(
                    //       util.bitAnd(match.desc1.feature, match.desc2.feature)
                    //     ),
                    //   }))
                    // );
                    console.log(matches.length);
                    matches.forEach((match) => {
                      draw_line(
                        cross,
                        match.desc1.keypoint[0],
                        match.desc1.keypoint[1],
                        match.desc2.keypoint[0] + img1.org.getWidth(),
                        match.desc2.keypoint[1]
                      );
                    });
                    cross.write(out);
                    resolve();
                  }
                );
              })
          );
        })
    );
  });
}
module.exports = { match };

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
