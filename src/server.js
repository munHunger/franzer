const http = require("http");
const fs = require("fs");

const express = require("express");
const cors = require("cors");

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3000;

const { match } = require("./matcher");

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.get("/", express.static("./public"));

app.get("/image.jpg", (req, res) => {
  res.sendFile("/tmp/out.png");
});
app.post("/upload", (req, res) => {
  let data = req.body;

  writeImage(data.a, `/tmp/${data.id}a.png`);
  writeImage(data.b, `/tmp/${data.id}b.png`);
  match(`/tmp/${data.id}a.png`, `/tmp/${data.id}b.png`, `/tmp/${data.id}c.png`)
    .then(() => fs.promises.readFile(`/tmp/${data.id}c.png`, "base64"))
    .then((data) =>
      res.status(200).json({
        img: "data:image/png;base64," + data,
      })
    );
});

function writeImage(base64Data, path) {
  base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
  fs.writeFile(path, base64Data, "base64", (err) => {
    if (err) console.log("error:" + err);
  });
}
