let { getValue } = require("./util");
var Jimp = require("jimp");

/**
 * The width and height of each patch
 */
const pathSize = 25;
const pairCount = 512;

/**
 * @type {Array.<Array.<Array.<number>>>} a list of x,y pairs
 */
const sampleGeometry = [];

for (let i = 0; i < pairCount; i++) {
  const random = () => Math.floor(Math.random() * pathSize);
  sampleGeometry.push([
    [random(), random()],
    [random(), random()],
  ]);
}

/**
 * @typedef {Object} brief feature
 * @property {Array.<number>} keypoint the original keypoint
 * @property {Array.<number>} feature the brief featureset
 */

/**
 * @param {*} img the Jimp image to run brief over
 * @param {Array.<Array.<number>>} keypoints the keypoints to describe
 * @returns {Promise<Array.<brief>>} a list of described features
 */
function brief(img, keypoints) {
  return new Promise((resolve, reject) => {
    resolve(
      keypoints.map((keypoint) => {
        let feature = new Array(pairCount / 32).fill(0);
        sampleGeometry.forEach((pair, index) => {
          let p1 = getValue(
            img,
            keypoint[0] + pair[0][0],
            keypoint[1] + pair[0][1]
          );
          let p2 = getValue(
            img,
            keypoint[0] + pair[1][0],
            keypoint[1] + pair[1][1]
          );
          if (p1 > p2) {
            feature[Math.floor(index / 32)] =
              feature[Math.floor(index / 32)] |
              Math.pow(2, Math.floor(index % 32));
          }
        });
        return { keypoint, feature };
      }) //TODO: Add a spacial index of features
    );
  });
}

module.exports = { brief };
