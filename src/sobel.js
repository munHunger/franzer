let { getValue } = require("./util");
var Jimp = require("jimp");

function sobel(img) {
  let poi = [];
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

      if (strength > 225) poi.push([x, y]);
    }
  }
  return poi;
}

module.exports = { sobel };
