var Jimp = require("jimp");
var math = require("mathjs");
const { or } = require("mathjs");

const MAX_PIXEL = 4294967295;

Jimp.read("data/cup1.jpg", (err, img) => {
  if (err) throw err;
  img
    .resize(256, 256) // resize
    .quality(100); // set JPEG quality

  img.clone((err, org) => {
    if (err) throw err;
    img
      .greyscale() // set greyscale
      .write("data/grayscale.jpg"); // save

    let max = 0;
    for (let x = 0; x < img.getWidth(); x++) {
      for (let y = 0; y < img.getHeight(); y++) {
        max = Math.max(max, Jimp.intToRGBA(img.getPixelColor(x, y)).r);
      }
    }

    for (let x = 0; x < img.getWidth(); x++) {
      for (let y = 0; y < img.getHeight(); y++) {
        let strength = (Jimp.intToRGBA(img.getPixelColor(x, y)).r / max) * 255;
        img.setPixelColor(
          Jimp.rgbaToInt(strength, strength, strength, 255),
          x,
          y
        );
      }
    }
    img.write("data/normalized.jpg");

    img.clone((err, norm) => {
      if (err) throw err;
      let rad = 2;
      for (let x = rad; x < norm.getWidth() - rad; x++) {
        for (let y = rad; y < norm.getHeight() - rad; y++) {
          let base = Jimp.intToRGBA(norm.getPixelColor(x, y)).r;
          let diffs = 0;
          for (let xX = -rad; xX <= rad; xX += rad) {
            for (let yY = -rad; yY <= rad; yY += rad) {
              diffs += Math.abs(
                Jimp.intToRGBA(norm.getPixelColor(x + xX, y + yY)).r - base
              );
            }
          }
          diffs /= 8;
          // diffs = diffs > 25 ? 255 : 0;
          img.setPixelColour(Jimp.rgbaToInt(diffs, diffs, diffs, 255), x, y);
        }
      }
      img.write("data/border.jpg");

      norm.gaussian(1);

      norm.clone((err, norm) => {
        sobel(norm, norm, (sobel) => harris(sobel, org));
      });
    });
  });
});

function sobel(img, org, callback) {
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
    org.write("data/sobel.jpg");
    callback.apply(this, [org]);
  });
}

function harris(img, org) {
  let points = 0;
  img.clone((err, img) => {
    if (err) throw err;
    let rad = 1;
    for (let x = rad; x < img.getWidth() - rad; x++) {
      for (let y = rad; y < img.getHeight() - rad; y++) {
        let rT = 9000000000;
        let cT = 500000;

        let eigs = math.eigs(getHarrisWindow(img, x, y));
        let l1 = eigs.values[0];
        let l2 = eigs.values[1];

        let r = l1 * l2 - 0.05 * Math.pow(l1 + l2, 2);
        // console.log([r, l1, l2, Math.abs(l1 - l2)])
        if (Math.abs(r) > rT) {
          //not flat
          if (Math.abs(l1 - l2) > cT) {
            org.setPixelColour(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
            // org.setPixelColour(Jimp.rgbaToInt(0, 0, 200, 255), x, y);
            //edge
          } else {
            org.setPixelColour(Jimp.rgbaToInt(255, 0, 0, 255), x, y);
            points++;
            //corner
          }
        }
        else org.setPixelColour(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
      }
    }
    org.write("data/imp.jpg");
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
