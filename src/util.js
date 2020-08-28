var Jimp = require("jimp");

function getValue(img, x, y) {
  return Jimp.intToRGBA(img.getPixelColor(x, y)).r;
}

function getImg(path, dest, debug) {
  return new Promise((resolve, reject) => {
    Jimp.read(path, (err, img) => {
      if (err) reject(err);
      img.resize(512, 512).quality(100);

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
        else resolve(img);
      });
    });
  });
}

module.exports = { getValue, getImg };
