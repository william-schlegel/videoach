import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const william = await prisma.user.upsert({
    where: { email: "william@ironeec.com" },
    update: {},
    create: {
      email: "william@ironeec.com",
      name: "William",
      image:
        "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10160568857483134&height=50&width=50&ext=1672928640&hash=AeQ0frh06y96II7DD5g",
      role: "MANAGER",
    },
  });
  await prisma.activityGroup.createMany({
    data: [
      {
        name: "Cardio",
        default: true,
      },
      { name: "Fitness", default: true },
      { name: "Aquatique", default: true },
      { name: "Cross Fit", default: true },
    ],
  });
  const groups = await prisma.activityGroup.findMany();
  await prisma.club.createMany({
    data: [
      {
        name: "Moving",
        address: "Mours",
        managerId: william.id,
      },
      {
        name: "610 Crew",
        address: "Eragny",
        managerId: william.id,
      },
    ],
  });

  const clubs = await prisma.club.findMany();
  const movingId = clubs.find((c) => c.name === "Moving").id;
  const crewId = clubs.find((c) => c.name === "610 Crew").id;

  await prisma.site.createMany({
    data: [
      {
        name: "Mours",
        address: "Rue du moving",
        clubId: movingId,
      },
      {
        name: "Eragny",
        address: "Gymnase de la bute",
        clubId: crewId,
      },
      {
        name: "Conflans",
        address: "Salle de sport de conflans",
        clubId: crewId,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        name: "Body Combat",
        groupId: groups.find((g) => g.name === "Fitness").id,
        clubId: crewId,
      },
      {
        name: "Body Attack",
        groupId: groups.find((g) => g.name === "Cardio").id,
        clubId: crewId,
      },
      {
        name: "Aquabike",
        groupId: groups.find((g) => g.name === "Aquatique").id,
        clubId: movingId,
      },
      {
        name: "Body Combat",
        groupId: groups.find((g) => g.name === "Fitness").id,
        clubId: movingId,
      },
      {
        name: "Body Attack",
        groupId: groups.find((g) => g.name === "Cardio").id,
        clubId: movingId,
      },
    ],
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
