class BST {
  /**
   * @type {string} a string index consisting of ones and zeroes
   */
  index;
  constructor(index) {
    if (!index) index = "";
    this.index = index;
  }

  addValue(index, v) {
    if (this.index === index) this.value = v;
    else {
      let next = index.substring(this.index.length)[0];
      if (next === "1") {
        if (!this.right) this.right = new BST(this.index + "1");
        this.right.addValue(index, v);
      } else {
        if (!this.left) this.left = new BST(this.index + "0");
        this.left.addValue(index, v);
      }
    }
  }

  find(index, errors = 0) {
    if (index.length === 0) return this.value;
    if (errors > 15) return null;
    let next = index[0];
    let child = next === "1" ? this.right : this.left;
    let errChild = next === "1" ? this.left : this.right;
    if (child) return child.find(index.substring(1), errors);
    else if (errChild)
      return (next === "1" ? this.left : this.right).find(
        index.substring(1),
        errors + 1
      );
    else return null;
  }
}

module.exports = { BST };
