var Jimp = require("jimp");

function getValue(img, x, y) {
  return Jimp.intToRGBA(img.getPixelColor(x, y)).r;
}

function getImg(path, dest, debug) {
  return new Promise((resolve, reject) => {
    Jimp.read(path, (err, img) => {
      if (err) reject(err);
      img.clone((err, org) => {
        if (err) reject(err);
        img.resize(512, 512).quality(100);
        org.resize(512, 512).quality(100);

        img.greyscale();
        if (debug) img.write(dest + "/grayscale.jpg"); // save

        let max = 0;
        let min = 255;
        for (let x = 0; x < img.getWidth(); x++) {
          for (let y = 0; y < img.getHeight(); y++) {
            max = Math.max(max, getValue(img, x, y));
            min = Math.min(min, getValue(img, x, y));
          }
        }

        for (let x = 0; x < img.getWidth(); x++) {
          for (let y = 0; y < img.getHeight(); y++) {
            let strength = ((getValue(img, x, y) - min) / (max - min)) * 255;

            img.setPixelColor(
              Jimp.rgbaToInt(strength, strength, strength, 255),
              x,
              y
            );
          }
        }
        if (debug) img.write(dest + "/normalized.jpg");
        img.clone((err, img) => {
          if (err) reject(err);
          img.blur(3, (err, img) => {
            if (err) reject(err);
            else resolve({ img, org });
          });
        });
      });
    });
  });
}

/**
 * counts the number of bits in the feature
 * Note: I am not smart enough to understand how this works... bitwise magic
 * @param {Array.<number>} feature the feature to count
 * @returns {number} the number of 1s in the feature
 */
function bitCount(feature) {
  return feature
    .map((n) => {
      n = n - ((n >> 1) & 0x55555555);
      n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
      return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
    })
    .reduce((acc, val) => (acc += val), 0);
}

/**
 * bitwise and over the featureset
 * @param {Array.<number>} f1 the first feature set
 * @param {Array.<number>} f2 the second feature set
 * @returns {Array.<number>} a bitwise operation f1 & f2
 */
function bitAnd(f1, f2) {
  return f1.map((f1, index) => f1 & f2[index]);
}

function printFeature(feature) {
  return feature
    .map((dec) =>
      (new Array(32).fill("0").join("") + (dec >>> 0).toString(2)).slice(-32)
    )
    .join("");
}
module.exports = { getValue, getImg, bitCount, bitAnd, printFeature };
