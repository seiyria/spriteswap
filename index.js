const argv = require('minimist')(process.argv.slice(2));
const PNG = require('pngjs').PNG;
const fs = require('fs-extra');
const _ = require('lodash');

const { palette, image, out } = argv;

if(!palette) {
  console.error('no --palette specified');
  process.exit(0);
}

if(!image) {
  console.error('no --image specified');
  process.exit(0);
}

if(!out) {
  console.error('no --out specified');
  process.exit(0);
}

const paletteFile = _.replace(fs.readFileSync(palette, 'UTF-8'), /  +/g, ' ');

const paletteColors = _(paletteFile)
  .split('\n')
  .map(line => {
    const [r, g, b] = line.trim().split(' ');
    return { r: +r, g: +g, b: +b };
  })
  .value();

const differenceBetween = (color1, color2) => {
  return Math.abs(
    color1.r - color2.r
  + color1.g - color2.g
  + color1.b - color2.b
  );
};

const findClosestColorTo = (color) => {
  return _.minBy(paletteColors, testColor => differenceBetween(color, testColor));
};

/*
const imageData = fs.readFileSync(image);

const png = new PNG({
  filterType: 4
});

png.parse(imageData, (e, data) => {
  console.log(data);
});
*/

fs.createReadStream(image)
    .pipe(new PNG({
        filterType: 4
    }))
    .on('parsed', function() {
        for(var y = 0; y < this.height; y++) {
            for(var x = 0; x < this.width; x++) {
                var idx = (this.width * y + x) << 2;

                const myColor = { r: this.data[idx], g: this.data[idx+1], b: this.data[idx+2] };
                const closestColor = findClosestColorTo(myColor);

                // invert color
                this.data[idx]   = closestColor.r;
                this.data[idx+1] = closestColor.g;
                this.data[idx+2] = closestColor.b;
            }
        }

        this.pack().pipe(fs.createWriteStream(out));
    });
