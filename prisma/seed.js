require("dotenv/config");
const bcrypt = require("bcryptjs");
const prisma = require("../src/utils/prisma");

const seedUser = async ({ name, email, role, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash,
      isActive: true,
      emailVerified: now,
    },
    create: {
      name,
      email,
      role,
      passwordHash,
      isActive: true,
      emailVerified: now,
    },
  });
};

const main = async () => {
  await seedUser({
    name: "sekretariscabang",
    email: "sekretariscabang@gmail.com",
    role: "SEKRETARIS_CABANG",
    password: "password",
  });
  await seedUser({
    name: "sekretarispacmagetan",
    email: "sekretarispacmagetan@gmail.com",
    role: "SEKRETARIS_PAC",
    password: "password",
  });
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    await prisma.$disconnect();
    throw err;
  });
