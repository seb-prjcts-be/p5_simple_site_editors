// JS: de p5-sketch zelf.
function setup() {
  const c = createCanvas(400, 360);
  c.parent('sketch');
  noStroke();
}

function draw() {
  background(20);
  fill(255, 0, 125);
  circle(mouseX, mouseY, 60);
}
