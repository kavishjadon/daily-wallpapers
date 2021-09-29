const axios = require("axios");
const cheerio = require("cheerio");
const wallpaper = require("wallpaper");
const mousetrap = require("mousetrap");
const app = require("electron").remote.app;
const path = require("path");
const services = require("./services");
const { v4: uuid } = require("uuid");
const fs = require("fs");

axios.defaults.adapter = require("axios/lib/adapters/http");

let main = new Vue({
  el: "#main",
  data: {
    photos: [],
    link: "",
    default_link: "",
    result: true,
    applying: false,
    searching: false,
    canFetch: true,
    service: "wallpapers_wide",
    width: "1920",
    height: "1080",
  },
  methods: {
    checkNetwork: function () {
      if (navigator.onLine) {
        return this.fetchPhotos();
      }
      setTimeout(() => {
        this.checkNetwork();
      }, 1000);
    },
    fetchPhotos: function () {
      services[this.service]({
        path: this.link || this.default_link,
        width: this.width,
        height: this.height,
      })
        .then((data) => {
          let { photos, next_path } = data;
          console.log(photos);
          this.link = next_path;
          this.photos = [...this.photos, ...photos];
          this.canFetch = true;
          this.result = true;
          if (this.photos.length == 0) this.result = false;
        })
        .catch((err) => this.checkNetwork());
    },
    applyPhoto: function (imageUrl) {
      let filePath = path.join(app.getPath("pictures"), "daily-wallpaper.jpg");
      this.applying = true;
      if (navigator.onLine) {
        axios({
          url: imageUrl,
          method: "GET",
          responseType: "stream",
        })
          .then((res) => {
            var count = 0;
            const totalLen = Number(res.headers["content-length"]);
            const progress = document.querySelector(".ldBar").ldBar;
            res.data.on("data", (packet) => {
              count += Number(packet.length);
              progress.set(Math.floor((count / totalLen) * 100));
            });
            res.data.on("close", () => {
              (async () => {
                await wallpaper.set(filePath);
                this.applying = false;
                setTimeout(() => progress.set(0), 1e3);
              })();
            });
            res.data.pipe(fs.createWriteStream(filePath));
          })
          .catch((err) => (this.applying = false));
      } else {
        this.applying = false;
      }
    },
    handleScroll: function () {
      let imgLoading = document.querySelector(".lds-ellipsis");
      let pos = imgLoading.getBoundingClientRect();
      if (window.innerHeight / pos.y >= 1 && this.canFetch) {
        this.canFetch = false;
        this.fetchPhotos();
      }
    },
    searchToggle: function () {
      this.searching = !this.searching;
      this.$nextTick(() => {
        this.$refs.input.focus();
      });
      return false;
    },
    search: function (e) {
      if (e.target.value) {
        if (this.service == "wallpapers_craft") this.link = `/search/?query=${encodeURI(e.target.value)}`;
        else this.link = `/search?q=${encodeURI(e.target.value)}`;
      } else this.link = this.default_link;
      this.canFetch = false;
      this.photos = [];
      e.target.value = "";
      this.fetchPhotos();
      this.searchToggle();
    },
    goHome: function () {
      this.result = true;
      this.link = this.default_link;
      this.canFetch = false;
      this.fetchPhotos();
    },
  },
  created() {
    this.default_link = this.service == "wallpapers_wide" ? `/page/${Math.floor(Math.random() * 3800)}` : "";
    this.fetchPhotos();
    mousetrap.bind(["command+s", "ctrl+s"], this.searchToggle);
    window.addEventListener("scroll", this.handleScroll);
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
});
