const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const fs = require('fs');

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1472508606170796255";
const GUILD_ID = "1457740687264059394";
const EVALUATOR_ROLE = "1477961734722687019";

// ===== CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== DATA =====
let players = {};
let matchHistory = [];
let alreadyImported = false;

// ===== LOAD =====
if (fs.existsSync('./data.json')) {
  const data = JSON.parse(fs.readFileSync('./data.json'));
  players = data.players || {};
  matchHistory = data.history || [];
  alreadyImported = data.imported || false;
}

function saveData() {
  fs.writeFileSync('./data.json', JSON.stringify({
    players,
    history: matchHistory,
    imported: alreadyImported
  }, null, 2));
}

// ===== INIT =====
function init(id) {
  if (!players[id]) {
    players[id] = {
      wins: 0,
      losses: 0,
      points: 0,
      streak: 0
    };
  }
}

// ===== 🔥 ADD MATCH FUNCTION (USED FOR IMPORT + COMMAND) =====
function addMatch(p1, p2, winner, score) {
  const loser = winner === p1 ? p2 : p1;

  init(p1);
  init(p2);
  init(winner);
  init(loser);

  players[winner].wins++;
  players[loser].losses++;

  players[winner].points += 5;
  players[winner].streak++;
  players[loser].streak = 0;

  matchHistory.unshift({
    p1,
    p2,
    winner,
    loser,
    score
  });
}

// ===== 🔥 IMPORT OLD MATCHES (RUNS ONCE ONLY) =====
function importOldMatches() {
  if (alreadyImported) return;

  console.log("⏳ Importing old matches...");

  addMatch("475236711127842818", "1444589121241612332", "475236711127842818", "10-1");
  addMatch("778779991285825566", "1240342472022949952", "778779991285825566", "5-2");
  addMatch("1348230374219583520", "1240342472022949952", "1240342472022949952", "100-0");
  addMatch("1348230374219583520", "1011855003348111380", "1011855003348111380", "5-1");
  addMatch("1348230374219583520", "1006813436618997783", "1348230374219583520", "5-1");
  addMatch("1348230374219583520", "724470120646312067", "1348230374219583520", "5-1");
  addMatch("1444589121241612332", "935507803819364382", "1444589121241612332", "5-4");
  addMatch("1197244634376720477", "935507803819364382", "935507803819364382", "5-0");
  addMatch("1348230374219583520", "1240342472022949952", "1348230374219583520", "5-1");
  addMatch("778779991285825566", "724470120646312067", "724470120646312067", "5-1");
  addMatch("1011896980080955412", "1240342472022949952", "1240342472022949952", "5-0");
  addMatch("1006813436618997783", "724470120646312067", "1006813436618997783", "5-4");
  addMatch("1444589121241612332", "1232954364067315803", "1444589121241612332", "5-1");
  addMatch("847888735966330961", "935507803819364382", "935507803819364382", "10-0");
  addMatch("1037644546084978689", "724470120646312067", "724470120646312067", "5-1");
  addMatch("1348230374219583520", "1002491057243705455", "1348230374219583520", "5-3");
  addMatch("1339739748817703004", "724470120646312067", "724470120646312067", "5-2");
  addMatch("1018136337406246975", "1002491057243705455", "1018136337406246975", "5-3");
  addMatch("1339739748817703004", "1444589121241612332", "1444589121241612332", "5-2");
  addMatch("1444589121241612332", "1477575743474106368", "1444589121241612332", "10-5");
  addMatch("1011896980080955412", "1240342472022949952", "1240342472022949952", "5-0");
  addMatch("1168415776743637044", "1444589121241612332", "1168415776743637044", "10-4");
  addMatch("778779991285825566", "1444589121241612332", "1444589121241612332", "5-2");
  addMatch("1037644546084978689", "724470120646312067", "724470120646312067", "5-0");

  alreadyImported = true;
  saveData();

  console.log("✅ MATCHES IMPORTED");
}

// ===== RANKS =====
const RANK_ROLES = {
  "Upper Apex": "1458765056719458336",
  "Lower Apex": "1459559499445698674",
  "Upper Echelon": "1458766698596536455",
  "Lower Echelon": "1459559779834920960",
  "Upper Ascendant": "1458766830595215423",
  "Lower Ascendant": "1459559792786935996",
  "Upper Prime": "1458767152961163334",
  "Lower Prime": "1459560540455309373",
  "Upper Adept": "1458824938705125528",
  "Lower Adept": "1459560562039193813",
  "Upper Bound": "1458766037238677504",
  "Lower Bound": "1459560607358390322"
};

const ranks = Object.keys(RANK_ROLES);

// ===== GET ROLE RANK =====
async function getUserRank(member) {
  for (const roleId of Object.values(RANK_ROLES)) {
    if (member.roles.cache.has(roleId)) {
      return `<@&${roleId}>`;
    }
  }
  return "Unranked";
}

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('panel').setDescription('Open match panel'),

  new SlashCommandBuilder()
    .setName('match')
    .setDescription('Report match')
    .addUserOption(o => o.setName('player1').setDescription('Player 1').setRequired(true))
    .addUserOption(o => o.setName('player2').setDescription('Player 2').setRequired(true))
    .addUserOption(o => o.setName('winner').setDescription('Winner').setRequired(true))
    .addStringOption(o => o.setName('score').setDescription('Score').setRequired(true))
    .addStringOption(o => o.setName('rank1').setDescription('Rank 1').setRequired(true)
      .addChoices(...ranks.map(r => ({ name: r, value: r }))))
    .addStringOption(o => o.setName('rank2').setDescription('Rank 2').setRequired(true)
      .addChoices(...ranks.map(r => ({ name: r, value: r })))),
  
  new SlashCommandBuilder().setName('undo').setDescription('Undo last match'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Stats')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('leaderboard').setDescription('Leaderboard'),
  new SlashCommandBuilder().setName('history').setDescription('History')
].map(c => c.toJSON());

// ===== REGISTER =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Commands ready");
})();

// ===== READY =====
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  importOldMatches(); // ✅ SAFE
});

// ===== EVENTS =====
client.on('interactionCreate', async interaction => {

  const allowed =
    interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    interaction.member.roles.cache.has(EVALUATOR_ROLE);

  if (interaction.isChatInputCommand() && interaction.commandName === 'match') {

    if (!allowed)
      return interaction.reply({ content: "❌ No permission", ephemeral: true });

    const p1 = interaction.options.getUser('player1');
    const p2 = interaction.options.getUser('player2');
    const winner = interaction.options.getUser('winner');
    const score = interaction.options.getString('score');
    const rank1 = interaction.options.getString('rank1');
    const rank2 = interaction.options.getString('rank2');

    addMatch(p1.id, p2.id, winner.id, score);
    saveData();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle('🏆 Match Result')
          .setDescription(`${p1} vs ${p2}`)
          .addFields(
            { name: 'Winner', value: `${winner}`, inline: true },
            { name: 'Score', value: score, inline: true },
            { name: 'Ranks', value: `${p1} → ${rank1}\n${p2} → ${rank2}` }
          )
      ]
    });
  }

  // stats / leaderboard / history SAME AS YOUR CODE...
});

client.login(TOKEN);