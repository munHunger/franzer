<script>
  import { onMount } from "svelte";
  let result;
  let resultCanvas;
  let count = 0;
  let files;
  let video;
  let canvas;

  let images = [];
  function submit() {
    images.push(canvas.toDataURL());
    images = images.slice(-2);
    if (images.length == 2) {
      count++;
      fetch("http://localhost:3000/upload", {
        method: "POST",
        headers: {
          "Content-Type": "Application/json"
        },
        body: JSON.stringify({ a: images[0], b: images[1], id: count })
      })
        .then(data => data.json())
        .then(body => {
          let ctx = resultCanvas.getContext("2d");
          var image = new Image();
          let i = 0;
          image.onload = function() {
            ctx.drawImage(image, image.width * i, 0, image.width, image.height);
            i++;
            if (i == 1) image.src = images[1];
            else if (i == 2) {
              body.forEach(match => {
                ctx.fillStyle = "rgba(0,0,255,0.5)";
                ctx.fillRect(
                  match.desc1.keypoint[0],
                  match.desc1.keypoint[1],
                  2,
                  2
                );
                ctx.fillStyle = "rgba(0,255,0,0.5)";
                ctx.fillRect(
                  match.desc2.keypoint[0] + image.width,
                  match.desc2.keypoint[1],
                  2,
                  2
                );
                ctx.strokeStyle = "rgba(255,0,0,0.25)";

                ctx.beginPath();
                ctx.moveTo(match.desc1.keypoint[0], match.desc1.keypoint[1]);
                ctx.lineTo(
                  match.desc2.keypoint[0] + image.width,
                  match.desc2.keypoint[1]
                );
                ctx.stroke();
              });
            }
          };
          image.src = images[0];
        })
        .then(snap)
        .catch(
          error => console.log(error) // Handle the error response object
        );
    } else snap();
  }

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(error => {
        console.log("Something went wrong!");
        console.error(error);
      });
  }

  function snap() {
    canvas.getContext("2d").drawImage(video, 0, 0, 500, 500);
    submit();
  }
  onMount(() => {
    snap();
  });
</script>

<style>
  #container {
    margin: 0px auto;
    width: 500px;
    height: 375px;
    border: 10px #333 solid;
  }
  #videoElement {
    width: 500px;
    height: 375px;
    background-color: #666;
  }
</style>

<div id="container">
  <video autoplay="true" id="videoElement" bind:this={video} />
  <canvas width="500" height="500" style="display:none" bind:this={canvas} />
  <img bind:this={result} />
</div>

<canvas bind:this={resultCanvas} width="1000" height="500" />
