/* VARIABELEN */
let levens = 3;
let sterren = [];
let bom1, bom2, bom3;
let canvas, raster, speler, pingpongbal;
let alice, bob, cindy;
let raket1, raket2, raket3;

let schadeFlitsTimer = 0;
let achtergrondKleur;

/*AFBEELDINGEN */
let imgAchtergrond;
let imgSpeler, imgAlice, imgBob, imgCindy;
let imgPingpongbal, imgRaket;
let imgBom;

/* PRELOAD (alle afbeeldingen) */
function preload() {
  imgAchtergrond = loadImage("images/backgrounds/landschap.jpg");

  imgAlice       = loadImage("images/sprites/Alice100px/Alice.png");
  imgBob         = loadImage("images/sprites/Bob100px/Bob.png");
  imgBom         = loadImage("images/sprites/bom.png");
}

/* RASTER KLASSE */
class Raster {
  constructor(rijen, kolommen) {
    this.aantalRijen = rijen;
    this.aantalKolommen = kolommen;
    this.celGrootte = null;
  }

  berekenCelGrootte() {
    this.celGrootte = canvas.width / this.aantalKolommen;
  }

  teken() {
    push();
    let overRand = false;

    for (let rij = 0; rij < this.aantalRijen; rij++) {
      for (let kolom = 0; kolom < this.aantalKolommen; kolom++) {
        let isRand =
          rij === 0 ||
          rij === this.aantalRijen - 1 ||
          kolom === 0 ||
          kolom === this.aantalKolommen - 1;

        if (isRand) {
          fill(0, 0, 255, 50);
          stroke('blue');
          strokeWeight(5);

          // Controleer of muis over deze randcel is
          if (
            mouseX >= kolom * this.celGrootte &&
            mouseX < (kolom + 1) * this.celGrootte &&
            mouseY >= rij * this.celGrootte &&
            mouseY < (rij + 1) * this.celGrootte
          ) {
            overRand = true;
          }
        } else {
          noFill();
          stroke('grey');
          strokeWeight(1);
        }

        rect(
          kolom * this.celGrootte,
          rij * this.celGrootte,
          this.celGrootte,
          this.celGrootte
        );
      }
    }

    pop();

    // Achtergrond veranderen als muis over randcel is
    if (overRand) {
      achtergrondKleur = color(200, 200, 255);
    } else {
      achtergrondKleur = imgAchtergrond;
    }
  }
}

/* SPELER */
class Speler {
  constructor() {
    this.x = 0;
    this.y = 300;
    this.animatie = [];
    this.stapGrootte = null;
    this.gehaald = false;
  }

  beweeg() {
    if (keyIsDown(65)) this.x -= this.stapGrootte; // A
    if (keyIsDown(68)) this.x += this.stapGrootte; // D
    if (keyIsDown(87)) this.y -= this.stapGrootte; // W
    if (keyIsDown(83)) this.y += this.stapGrootte; // S

    this.x = constrain(this.x, 0, canvas.width - raster.celGrootte);
    this.y = constrain(this.y, 0, canvas.height - raster.celGrootte);

    if (this.x >= canvas.width - raster.celGrootte) {
      this.gehaald = true;
    }
  }

  wordtGeraakt(vijand) {
    return dist(this.x, this.y, vijand.x, vijand.y) < raster.celGrootte / 2;
  }

  eetBal(bal) {
    return dist(this.x, this.y, bal.x, bal.y) < raster.celGrootte / 2;
  }

  toon() {
    if (this.animatie[0]) {
      image(this.animatie[0], this.x, this.y, raster.celGrootte, raster.celGrootte);
    } else {
      fill("green");
      circle(
        this.x + raster.celGrootte / 2,
        this.y + raster.celGrootte / 2,
        raster.celGrootte * 0.8
      );
    }
  }
}

/* PINGPONGBAL */
class Pingpongbal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 10;
    this.dy = 10;
    this.sprite = null;
    this.straal = 10;
    this.actief = true;
  }

  beweeg() {
    if (!this.actief) return;

    this.x += this.dx;
    this.y += this.dy;

    if (this.x < this.straal || this.x > width - this.straal) this.dx *= -1;
    if (this.y < this.straal || this.y > height - this.straal) this.dy *= -1;
  }

  reset() {
    let kolom = floor(random(1, raster.aantalKolommen - 1));
    let rij   = floor(random(1, raster.aantalRijen - 1));

    this.x = kolom * raster.celGrootte;
    this.y = rij * raster.celGrootte;
    this.actief = true;
  }

  toon() {
    if (!this.actief) return;

    if (this.sprite) {
      image(this.sprite, this.x, this.y, raster.celGrootte, raster.celGrootte);
    } else {
      fill("white");
      ellipse(this.x, this.y, 20);
    }
  }
}

/* VIJAND */
class Vijand {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = null;
    this.stapGrootte = raster ? raster.celGrootte : 50;
  }

  beweeg() {
    this.x += floor(random(-1, 2)) * this.stapGrootte;
    this.y += floor(random(-1, 2)) * this.stapGrootte;

    this.x = constrain(this.x, 0, width - raster.celGrootte);
    this.y = constrain(this.y, 0, height - raster.celGrootte);
  }

  toon() {
    if (this.sprite) {
      image(this.sprite, this.x, this.y, raster.celGrootte, raster.celGrootte);
    } else {
      fill("red");
      circle(
        this.x + raster.celGrootte / 2,
        this.y + raster.celGrootte / 2,
        raster.celGrootte * 0.8
      );
    }
  }
}

/* RAKET */
function randomRaketPlek() {
  let kolom = floor(random(1, raster.aantalKolommen - 1));
  let rij = floor(random(1, raster.aantalRijen - 1));
  return { x: kolom * raster.celGrootte, y: rij * raster.celGrootte };
}

class Raket {
  constructor(x, y, snelheidStart, gravity, krachtOmhoog, maxSnelheid) {
    this.x = x;
    this.y = y;
    this.snelheid = snelheidStart;
    this.gravity = gravity;
    this.krachtOmhoog = krachtOmhoog;
    this.maxSnelheid = maxSnelheid;
    this.sprite = null;
  }

  beweeg() {
    this.snelheid += this.gravity;
    this.snelheid = constrain(this.snelheid, -this.maxSnelheid, this.maxSnelheid);
    this.y += this.snelheid;

    if (this.y > height - raster.celGrootte) {
      this.y = height - raster.celGrootte;
      this.snelheid = this.krachtOmhoog;
    }

    if (this.y < 0) {
      this.y = 0;
      this.snelheid = abs(this.snelheid);
    }
  }

  toon() {
    if (this.sprite) {
      image(this.sprite, this.x, this.y, raster.celGrootte, raster.celGrootte);
    } else {
      fill("orange");
      triangle(
        this.x + raster.celGrootte / 2, this.y,
        this.x, this.y + raster.celGrootte,
        this.x + raster.celGrootte, this.y + raster.celGrootte
      );
    }
  }
}

/* BOM */
class Bom {
  constructor() {
    this.reset();
  }

  reset() {
    let kolom = floor(random(2, raster.aantalKolommen - 2));
    let rij   = floor(random(2, raster.aantalRijen - 2));

    this.x = kolom * raster.celGrootte;
    this.y = rij * raster.celGrootte;
  }

  toon() {
    if (imgBom) {
      image(imgBom, this.x, this.y, raster.celGrootte, raster.celGrootte);
    } else {
      fill(255, 0, 0);
      ellipse(
        this.x + raster.celGrootte / 2,
        this.y + raster.celGrootte / 2,
        raster.celGrootte * 0.8
      );
    }
  }
}

/* EINDSCHERM */
function toonEindscherm(gewonnen) {
  if (gewonnen) {
    background("green");
    fill("white");
    textSize(40);
    text("Je hebt gewonnen!", 30, 300);
  } else {
    background("red");
    fill("white");
    textSize(60);
    text("Game Over", 100, 300);
  }

  fill(255);
  textSize(28);
  text("Druk op R om opnieuw te spelen", 20, 500);

  noLoop();
}

/* INIT GAME */
function initGame() {
  speler = new Speler();
  speler.stapGrootte = raster.celGrootte;
  speler.animatie = [imgSpeler];
  speler.gehaald = false;

  pingpongbal = new Pingpongbal(100, 100);
  pingpongbal.sprite = imgPingpongbal;
  pingpongbal.reset();

  alice = new Vijand(700, 200);
  bob   = new Vijand(600, 400);
  cindy = new Vijand(200, 500);

  alice.sprite = imgAlice;
  bob.sprite   = imgBob;
  cindy.sprite = imgCindy;

  let rp1 = randomRaketPlek();
  let rp2 = randomRaketPlek();
  let rp3 = randomRaketPlek();

  raket1 = new Raket(rp1.x, rp1.y, random(-4, 4), 0.3, -20, 25);
  raket2 = new Raket(rp2.x, rp2.y, random(-5, 5), 0.4, -25, 30);
  raket3 = new Raket(rp3.x, rp3.y, random(-6, 6), 0.5, -30, 35);

  raket1.sprite = imgRaket;
  raket2.sprite = imgRaket;
  raket3.sprite = imgRaket;

  bom1 = new Bom();
  bom2 = new Bom();
  bom3 = new Bom();

  levens = 3;
  schadeFlitsTimer = 0;

  loop();
}

/* SETUP */
function setup() {
  canvas = createCanvas(900, 600);
  frameRate(10);
  textFont("Verdana");

  canvas.elt.tabIndex = 0;
  canvas.elt.focus();

  raster = new Raster(12, 18);
  raster.berekenCelGrootte();

  achtergrondKleur = imgAchtergrond;
  initGame();
  maakSterren(80);
}

/* DRAW */
function draw() {
  if (achtergrondKleur instanceof p5.Image) {
    image(achtergrondKleur, 0, 0, width, height);
  } else {
    background(achtergrondKleur);
  }

  beweegSterren();
  raster.teken();

  speler.beweeg();
  speler.toon();

  alice.beweeg(); alice.toon();
  bob.beweeg(); bob.toon();
  cindy.beweeg(); cindy.toon();

  raket1.beweeg(); raket1.toon();
  raket2.beweeg(); raket2.toon();
  raket3.beweeg(); raket3.toon();

  pingpongbal.beweeg();
  pingpongbal.toon();

  bom1.toon();
  bom2.toon();
  bom3.toon();

  // Botsingen
  if (
    speler.wordtGeraakt(alice) ||
    speler.wordtGeraakt(bob) ||
    speler.wordtGeraakt(cindy) ||
    speler.wordtGeraakt(raket1) ||
    speler.wordtGeraakt(raket2) ||
    speler.wordtGeraakt(raket3) ||
    speler.wordtGeraakt(bom1) ||
    speler.wordtGeraakt(bom2) ||
    speler.wordtGeraakt(bom3)
  ) {
    levens--;
    schadeFlitsTimer = 5;

    // Bommen komen op nieuwe plekken
    bom1.reset();
    bom2.reset();
    bom3.reset();

    if (levens <= 0) {
      toonEindscherm(false);
      return;
    }
  }

  // Pingpongbal pakken
  if (pingpongbal.actief && speler.eetBal(pingpongbal)) {
    levens++;
    pingpongbal.actief = false; // bal verdwijnt
  }

  // Win
  if (speler.gehaald) {
    toonEindscherm(true);
    return;
  }

  // Schade flits
  if (schadeFlitsTimer > 0) {
    fill(255, 0, 0, 100);
    rect(0, 0, width, height);
    schadeFlitsTimer--;
  }

  // HUD
  fill("black");
  textSize(24);
  text("Levens: " + levens, 20, 30);
}

/* STERREN FUNCTIES */
function maakSterren(aantal) {
  sterren = [];
  for (let i = 0; i < aantal; i++) {
    sterren.push({
      x: random(width),
      y: random(height),
      grootte: random(1, 3),
      snelheid: random(0.5, 2)
    });
  }
}

function beweegSterren() {
  fill(255);
  noStroke();
  for (let ster of sterren) {
    ellipse(ster.x, ster.y, ster.grootte);
    ster.x -= ster.snelheid;
    if (ster.x < 0) {
      ster.x = width;
      ster.y = random(height);
    }
  }
}

/* RESTART MET 'R' */
window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    initGame();
  }
});