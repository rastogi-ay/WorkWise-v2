const TEAMS = ['product', 'engineering'];

async function sendMessage(customerId) {
  const team = TEAMS[Math.floor(Math.random() * TEAMS.length)];

  await stiggClient.reportEvent({
    customerId,
    eventName: 'message-sent',
    idempotencyKey: customerId + '-' + String(Date.now()),
    dimensions: {
      team,
    },
  });

  return {
    message: 'Message sent successfully to team: ' + team,
  };
}

export { sendMessage };
