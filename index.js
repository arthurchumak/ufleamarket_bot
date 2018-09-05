const Telegraf = require("telegraf");
const axios = require("axios");
const cheerio = require("cheerio");
const urljoin = require("url-join");

const bot = new Telegraf(process.env.BOT_TOKEN);

function load(url, params) {
    return axios({
        method: "get",
        url,
        params,
        transformResponse: cheerio.load,
        responseEncoding: "utf8"
    }).then(res => res.data);
}

function formatError(error) {
    return process.env.NODE_ENV === "production" ? "Опачки" : "Error: " + error.message;
}

bot.command("start", ({ reply }) => {
    reply("Привет! Напиши что-нибудь и я найду это на барахолке!");
});

bot.on("message", (ctx) => {
    load("https://baraholka.onliner.by/search.php", { q: ctx.message.text })
        .then(doc => doc(".ba-tbl-list__table .wraptxt a").map(function (i, el) {
            const e = {
                url: urljoin("https://baraholka.onliner.by/", cheerio(this).attr("href")),
                text: cheerio(this).text()
            };
            return e;
        }).get())
        .then(rows => rows.map(row => row.text + "\n" + row.url))
        .then(rows => rows.join("\n\n"))
        .then((text) => ctx.reply(text || "Ничего не нашлось =("))
        .catch(error => ctx.reply(formatError(error)));
});

bot.startPolling();