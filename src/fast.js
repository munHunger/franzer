let { getValue } = require("./util");
var Jimp = require("jimp");

/**
 *
 * @param {*} org the Jimp image to run fast over
 * @param {*} dest if debug, this is the output folder to write to
 * @param {*} debug if true, then write a debug image
 * @param {*} threshold how big the pixel difference has to be to be important
 * @returns {Promise<Array.<Array.<number>>>} A list of x,y cords of keypoints
 */
function fast(org, dest, debug, threshold = 5) {
  let points = [
    [0, -3],
    [1, -3],
    [2, -2],
    [3, -1],
    [3, 0],
    [3, 1],
    [2, 2],
    [1, 3],
    [0, 3],
    [-1, 3],
    [-2, 2],
    [-3, 1],
    [-3, 0],
    [-3, -1],
    [-2, -2],
    [-1, -3],
  ];

  let pois = [];
  return new Promise((resolve, reject) => {
    org.clone((err, img) => {
      for (let x = 1; x < img.getWidth() - 1; x++) {
        for (let y = 1; y < img.getWidth() - 1; y++) {
          let p = getValue(org, x, y);
          let counter = (list) =>
            list.map(
              (c) => Math.abs(getValue(org, x + c[0], y + c[1]) - p) > threshold
            );
          if (
            counter([points[0], points[4], points[8], points[12]]).reduce(
              (acc, val) => (acc += val ? 1 : 0),
              0
            ) < 4
          ) {
            img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
            continue; //SPEEEEEEEED!
          }
          let circle = counter(points);
          let i = 0;
          let count = 0;
          while (
            i < circle.length ||
            (circle[i % circle.length] && count < 12)
          ) {
            if (circle[i % circle.length]) count++;
            else count = 0;
            i++;
          }
          if (count > 11) {
            img.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), x, y);
            pois.push([x, y]);
          } else img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
        }
      }
      console.log(`found ${pois.length} points at threshold ${threshold}`);
      if (debug) img.write(`${dest}/fast${img.getWidth()}.jpg`);
      resolve(pois);
    });
  });
}

module.exports = { fast };
