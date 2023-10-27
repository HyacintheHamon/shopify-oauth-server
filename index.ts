import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import url from "url";
import request from "request-promise";

import verifyCall from "./tools/verify";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/install", function (req, res, next) {
  var shop = req.query.shop;
  var appId = process.env.appId;

  // var appSecret = process.env.appSecret;
  var appScope = process.env.appScope;
  var appDomain = process.env.appDomain;

  //build the url
  var installUrl = `https://${shop}/admin/oauth/authorize?client_id=${appId}&scope=${appScope}&redirect_uri=http://${appDomain}/shopify/auth`;

  // res.redirect(installUrl);
  res.json({
    redirectUrl: installUrl,
  });
});

app.get("/shopify/auth", function (req, res, next) {
  let securityPass = false;
  let appId = process.env.appId;
  let appSecret = process.env.appSecret;
  let shop = req.query.shop;
  let code = req.query.code;

  const regex = /^[a-z\d_.-]+[.]myshopify[.]com$/;

  if (shop.match(regex)) {
    console.log("regex is ok");
    securityPass = true;
  } else {
    //exit
    securityPass = false;
  }

  // 1. Parse the string URL to object
  let urlObj = url.parse(req.url);
  // 2. Get the 'query string' portion
  let query = urlObj.search.slice(1);
  if (verifyCall.verify(query)) {
    //get token
    console.log("get token");
    securityPass = true;
  } else {
    //exit
    securityPass = false;
  }

  if (securityPass && regex) {
    //Exchange temporary code for a permanent access token
    let accessTokenRequestUrl = "https://" + shop + "/admin/oauth/access_token";
    let accessTokenPayload = {
      client_id: appId,
      client_secret: appSecret,
      code,
    };

    request
      .post(accessTokenRequestUrl, { json: accessTokenPayload })
      .then((accessTokenResponse) => {
        let accessToken = accessTokenResponse.access_token;
        console.log("shop token " + accessToken);
        res.redirect("http://localhost:5173/success&token=" + accessToken);
        res.json({ access_token: accessToken });
        //res.redirect("/shopify/app?shop=" + shop);
      })
      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
      });
  } else {
    res.redirect("/installerror");
  }
});

app.get("/products", function (req, res, next) {
  let url = "https://" + req.query.shop + "/admin/products.json";

  let options = {
    method: "GET",
    uri: url,
    json: true,
    headers: {
      "X-Shopify-Access-Token": req.query.appToken,
      "content-type": "application/json",
    },
  };

  request(options)
    .then(function (parsedBody) {
      // console.log(parsedBody);
      res.json(parsedBody);
    })
    .catch(function (err) {
      // console.log(err);
      res.json(err);
    });
});

app.get("/orders", function (req, res, next) {
  let url = "https://" + req.query.shop + "/admin/orders.json";

  let options = {
    method: "GET",
    uri: url,
    json: true,
    headers: {
      "X-Shopify-Access-Token": req.query.appToken,
      "content-type": "application/json",
    },
  };

  request(options)
    .then(function (parsedBody) {
      // console.log(parsedBody);
      res.json(parsedBody);
    })
    .catch(function (err) {
      // console.log(err);
      res.json(err);
    });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
