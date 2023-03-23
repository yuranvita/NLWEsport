import express from "express";
import cors from "cors";
import { convertHourStringToMinutes } from "./utils/convert-hours-string-to-minutes";
import { PrismaClient } from "@prisma/client";
import { convertMinutesToHoursString } from "./utils/convert-minutes-to-hours-string";

const app = express();
const prisma = new PrismaClient({
  log: ["query"],
});

app.use(express.json());
app.use(cors());

app.get("/games", async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return res.status(200).json(games);
});

app.get("/games/:id/ads", async (req, res) => {
  const gameId = req.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weelDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weelDays.split(","),
        hourStart: convertMinutesToHoursString(ad.hourStart),
        hourEnd: convertMinutesToHoursString(ad.hourEnd),
      };
    })
  );
});

app.get("/ads/:id/discord", async (req, res) => {
  const adId = req.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return res.json({
    discord: ad.discord,
  });
});

app.post("/games/:gameId/ads", async (req, res) => {
  const gameId = req.params.gameId;
  const body = req.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weelDays: body.weelDays.join(","),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
      createdAt: body.createdAt,
    },
  });

  return res.status(201).json({ ad });
});

app.listen(3333);
