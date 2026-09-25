require("dotenv").config();

const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const { Appointment } = require("../models/Appointment");
const { Message } = require("../models/Message");
const { Post } = require("../models/Post");
const { User } = require("../models/User");

const demoEmails = {
  customer: "demo.customer@easybusy.test",
  beauty: "demo.beauty@easybusy.test",
  tutor: "demo.tutor@easybusy.test",
};

function dateInMonth(monthOffset, day, hour = 10) {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + monthOffset,
    day,
    hour,
  ));
}

function hoursAfter(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function daysFromNow(dayOffset, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function saveDemoUser(email, password, details) {
  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    user = new User({ email });
  }

  user.set(details);
  user.password = password;
  await user.save();
  return user;
}

function appointmentFor({ business, customer, service, startAt, status, note }) {
  return {
    customer: customer._id,
    business: business._id,
    service: {
      serviceId: service._id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
    },
    startAt,
    endAt: new Date(startAt.getTime() + service.durationMinutes * 60 * 1000),
    status,
    note,
  };
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The demo seed is disabled when NODE_ENV=production.");
  }

  if (process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Set ALLOW_DEMO_SEED=true in server/.env before running the demo seed.");
  }

  const password = process.env.DEMO_PASSWORD || "";
  if (password.length < 10 || /replace|change/i.test(password)) {
    throw new Error("DEMO_PASSWORD must be a private local password with at least 10 characters.");
  }

  await connectDatabase();

  const customer = await saveDemoUser(demoEmails.customer, password, {
    firstName: "Maya",
    lastName: "Demo",
    role: "customer",
    city: "Tel Aviv",
    bio: "Local customer discovering services and sharing recommendations.",
    avatarUrl: "",
    businessProfile: {},
  });

  const beautyOwner = await saveDemoUser(demoEmails.beauty, password, {
    firstName: "Dana",
    lastName: "Levi",
    role: "business_owner",
    city: "Tel Aviv",
    bio: "Nail artist and owner of Bloom Beauty Studio.",
    avatarUrl: "",
    businessProfile: {
      name: "Bloom Beauty Studio",
      category: "beauty",
      description: "A friendly neighborhood studio for nails and self-care.",
      phone: "03-555-0101",
      website: "",
      address: "Dizengoff Street, Tel Aviv",
      services: [
        {
          name: "Classic manicure",
          description: "Nail shaping, care and classic polish.",
          durationMinutes: 60,
          price: 120,
        },
        {
          name: "Gel manicure",
          description: "Long-lasting gel color and detailed nail care.",
          durationMinutes: 90,
          price: 180,
        },
      ],
    },
  });

  const tutorOwner = await saveDemoUser(demoEmails.tutor, password, {
    firstName: "Noa",
    lastName: "Cohen",
    role: "business_owner",
    city: "Ramat Gan",
    bio: "Private mathematics tutor for high-school students.",
    avatarUrl: "",
    businessProfile: {
      name: "Noa Math Studio",
      category: "education",
      description: "Personal lessons with a clear plan and practical exercises.",
      phone: "03-555-0102",
      website: "",
      address: "Bialik Street, Ramat Gan",
      services: [
        {
          name: "Private math lesson",
          description: "One-on-one lesson adapted to the student's current material.",
          durationMinutes: 60,
          price: 150,
        },
        {
          name: "Exam preparation session",
          description: "Focused practice session before an upcoming exam.",
          durationMinutes: 120,
          price: 280,
        },
      ],
    },
  });

  const demoUserIds = [customer._id, beautyOwner._id, tutorOwner._id];

  // Only records involving the dedicated demo accounts are replaced. Real
  // users and their content are never removed by this script.
  await Message.deleteMany({
    $or: [
      { sender: { $in: demoUserIds } },
      { recipient: { $in: demoUserIds } },
    ],
  });
  await Appointment.deleteMany({
    $or: [
      { customer: { $in: demoUserIds } },
      { business: { $in: demoUserIds } },
    ],
  });
  await Post.deleteMany({ author: { $in: demoUserIds } });

  await Post.insertMany([
    {
      author: beautyOwner._id,
      content: "New autumn colors arrived at Bloom Beauty Studio. Which shade would you choose?",
      category: "promotion",
      mediaType: "none",
      createdAt: dateInMonth(-2, 8, 9),
    },
    {
      author: tutorOwner._id,
      content: "Study tip: divide exam preparation into short topics and finish each session with two practice questions.",
      category: "recommendation",
      mediaType: "none",
      createdAt: dateInMonth(-1, 12, 16),
    },
    {
      author: customer._id,
      content: "Looking for recommendations for a local service that is easy to book online.",
      category: "question",
      mediaType: "none",
      createdAt: dateInMonth(0, 4, 11),
    },
    {
      author: beautyOwner._id,
      content: "A few appointment slots opened for next week. You can now book directly from our profile.",
      category: "general",
      mediaType: "none",
      createdAt: dateInMonth(0, 10, 14),
    },
  ]);

  const manicure = beautyOwner.businessProfile.services[0];
  const gelManicure = beautyOwner.businessProfile.services[1];
  const mathLesson = tutorOwner.businessProfile.services[0];
  const examSession = tutorOwner.businessProfile.services[1];

  await Appointment.insertMany([
    appointmentFor({
      customer,
      business: beautyOwner,
      service: manicure,
      startAt: dateInMonth(-5, 6, 10),
      status: "completed",
      note: "Demo completed appointment.",
    }),
    appointmentFor({
      customer,
      business: tutorOwner,
      service: mathLesson,
      startAt: dateInMonth(-4, 13, 17),
      status: "completed",
      note: "Algebra review.",
    }),
    appointmentFor({
      customer,
      business: beautyOwner,
      service: gelManicure,
      startAt: dateInMonth(-3, 18, 12),
      status: "cancelled",
      note: "Demo cancelled appointment.",
    }),
    appointmentFor({
      customer,
      business: tutorOwner,
      service: examSession,
      startAt: dateInMonth(-2, 9, 15),
      status: "completed",
      note: "Exam preparation.",
    }),
    appointmentFor({
      customer,
      business: beautyOwner,
      service: manicure,
      startAt: dateInMonth(-1, 21, 9),
      status: "declined",
      note: "Demo declined appointment.",
    }),
    appointmentFor({
      customer,
      business: tutorOwner,
      service: mathLesson,
      startAt: daysFromNow(2, 18),
      status: "confirmed",
      note: "Geometry practice.",
    }),
    appointmentFor({
      customer,
      business: beautyOwner,
      service: gelManicure,
      startAt: daysFromNow(5, 13),
      status: "pending",
      note: "Prefer a neutral color.",
    }),
    appointmentFor({
      customer,
      business: tutorOwner,
      service: examSession,
      startAt: dateInMonth(1, 7, 16),
      status: "pending",
      note: "Prepare for the next school exam.",
    }),
  ]);

  const fourDaysAgo = hoursAfter(new Date(), -96);
  const threeDaysAgo = hoursAfter(new Date(), -72);
  const twoDaysAgo = hoursAfter(new Date(), -48);
  const oneDayAgo = hoursAfter(new Date(), -24);

  await Message.insertMany([
    {
      sender: customer._id,
      recipient: beautyOwner._id,
      content: "Hi Dana, is the gel manicure suitable for short nails?",
      createdAt: fourDaysAgo,
    },
    {
      sender: beautyOwner._id,
      recipient: customer._id,
      content: "Absolutely. We can adapt the shape and color to short nails.",
      readAt: threeDaysAgo,
      createdAt: threeDaysAgo,
    },
    {
      sender: customer._id,
      recipient: tutorOwner._id,
      content: "Hi Noa, can the exam session focus on geometry?",
      createdAt: twoDaysAgo,
    },
    {
      sender: tutorOwner._id,
      recipient: customer._id,
      content: "Yes. Add the specific topics in the appointment note and I will prepare exercises.",
      createdAt: oneDayAgo,
    },
  ]);

  console.log("Demo data created successfully.");
  console.log(`Customer: ${demoEmails.customer}`);
  console.log(`Business owner: ${demoEmails.beauty}`);
  console.log(`Business owner: ${demoEmails.tutor}`);
  console.log("All demo accounts use the password stored in DEMO_PASSWORD.");
}

seed()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
