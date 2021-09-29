const { v4: uuid } = require("uuid");
const axios = require("axios");
const cheerio = require("cheerio");

const wallpapers_craft = ({ path = "", width = "1920", height = "1080" }) => {
  let url = "https://wallpaperscraft.com";

  return new Promise((resolve, reject) => {
    axios
      .get(`${url}${path}`)
      .then((res) => {
        let photos = [];
        let $ = cheerio.load(res.data);
        let next_path = $(".pager__item_selected").next().find("a").attr("href");
        let imgLinks = $(".wallpapers__canvas .wallpapers__image");
        for (let key in imgLinks) {
          if (Number(key) < 18) {
            photos.push({
              id: uuid(),
              url: imgLinks[key].attribs.src,
              down_url: imgLinks[key].attribs.src.replace("300x168", `${width}x${height}`),
            });
          }
        }
        resolve({ photos, next_path });
      })
      .catch(reject);
  });
};

const wallpapers_wide = ({ path = "", width = "1920", height = "1080" }) => {
  let url = `http://wallpaperswide.com`;
  return new Promise((resolve, reject) => {
    axios
      .get(`${url}${path}`)
      .then((res) => {
        let photos = [];
        let $ = cheerio.load(res.data);
        let next_path = $(".pagination a:last-of-type").attr("href");
        let imgLinks = $(".thumb_img");

        for (let key in imgLinks) {
          if (Number(key) < 18) {
            let image_url = imgLinks[key].attribs.src;
            image_url = image_url.replace("t1", "t2");
            let image_name = image_url.split("thumbs/").pop().split("-")[0];
            photos.push({
              id: uuid(),
              url: image_url,
              down_url: `${url}/download/${image_name}-wallpaper-${width}x${height}.jpg`,
            });
          }
        }
        resolve({ photos, next_path });
      })
      .catch(reject);
  });
};

module.exports = { wallpapers_craft, wallpapers_wide };
