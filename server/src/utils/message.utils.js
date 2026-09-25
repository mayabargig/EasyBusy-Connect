const userSelection =
  "firstName lastName avatarUrl role city businessProfile.name";

function presentUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    city: user.city,
    businessName: user.businessProfile?.name || "",
  };
}

function presentMessage(message) {
  return {
    id: message._id.toString(),
    sender: presentUser(message.sender),
    recipient: presentUser(message.recipient),
    content: message.content,
    readAt: message.readAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function populateMessage(messageOrQuery) {
  return messageOrQuery.populate([
    { path: "sender", select: userSelection },
    { path: "recipient", select: userSelection },
  ]);
}

function rolesCanChat(firstUser, secondUser) {
  if (!firstUser || !secondUser || firstUser.id === secondUser.id) return false;
  return new Set([firstUser.role, secondUser.role]).size === 2
    && [firstUser.role, secondUser.role].includes("customer")
    && [firstUser.role, secondUser.role].includes("business_owner");
}

module.exports = {
  populateMessage,
  presentMessage,
  presentUser,
  rolesCanChat,
  userSelection,
};
