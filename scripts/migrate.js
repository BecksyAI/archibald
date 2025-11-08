/**
 * Migration script to populate MongoDB with all data
 * Run with: node scripts/migrate.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  claimed: { type: Boolean, default: false },
  claimedAt: { type: Date },
}, { timestamps: true });

// Event Schema
const EventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  host: { type: String, required: true, trim: true },
  documented: { type: mongoose.Schema.Types.Mixed, default: false },
  description: { type: String, trim: true },
  images: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// WhiskyEntry Schema
const WhiskyEntrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  eventDate: { type: Date, required: true },
  host: { type: String, required: true, trim: true },
  countryOfOrigin: { type: String, required: true, trim: true },
  age: { type: mongoose.Schema.Types.Mixed },
  description: { type: String, trim: true },
  aromaNotes: { type: String, trim: true },
  tasteNotes: { type: String, trim: true },
  finishNotes: { type: String, trim: true },
  images: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Review Schema
const ReviewSchema = new mongoose.Schema({
  whiskyEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhiskyEntry', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  participantName: { type: String, required: true, trim: true },
  participantUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verdict: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ArchibaldPersona Schema
const ArchibaldPersonaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  age: { type: String, required: true },
  appearanceProjection: { type: String, required: true },
  originStory: { type: String, required: true },
  personalityMatrix: [{
    trait: String,
    description: String,
  }],
  catchphrases: [String],
  coreDirectives: [String],
}, { timestamps: true });

// ArchibaldMemory Schema
const ArchibaldMemorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  whiskyDetails: {
    name: { type: String, required: true },
    distillery: { type: String, required: true },
    region: { type: String, required: true },
    age: { type: mongoose.Schema.Types.Mixed, required: true },
    abv: { type: Number, required: true },
    tastingNotes: [String],
    caskType: { type: String, required: true },
    foodPairing: { type: String, required: true },
  },
  experienceDate: { type: String, required: true },
  experienceLocation: { type: String, required: true },
  narrative: { type: String, required: true },
  finalVerdict: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);
const WhiskyEntry = mongoose.model('WhiskyEntry', WhiskyEntrySchema);
const Review = mongoose.model('Review', ReviewSchema);
const ArchibaldPersona = mongoose.model('ArchibaldPersona', ArchibaldPersonaSchema);
const ArchibaldMemory = mongoose.model('ArchibaldMemory', ArchibaldMemorySchema);

function parseDate(dateStr) {
  const cleaned = dateStr.trim();
  
  // Try ISO date first
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try format like "Jan 25th, 2025" or "17 Aug, 2024"
  const dateMatch = cleaned.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      return new Date(parseInt(year), monthNum, parseInt(day));
    }
  }
  
  // Try format like "Feb 1" or "May 3" (assume current year)
  const shortMatch = cleaned.match(/(\w+)\s+(\d+)/i);
  if (shortMatch) {
    const [, month, day] = shortMatch;
    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      const year = new Date().getFullYear();
      return new Date(year, monthNum, parseInt(day));
    }
  }
  
  // Try format like "20 Apr 2024"
  const yearMatch = cleaned.match(/(\d+)\s+(\w+)\s+(\d{4})/i);
  if (yearMatch) {
    const [, day, month, year] = yearMatch;
    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      return new Date(parseInt(year), monthNum, parseInt(day));
    }
  }
  
  console.warn(`Could not parse date: ${dateStr}, using current date`);
  return new Date();
}

function normalizeUsername(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: 'archibald' });
    console.log('Connected to MongoDB database: archibald');

    const results = {
      events: 0,
      whiskies: 0,
      reviews: 0,
      users: 0,
      archibaldPersona: 0,
      archibaldMemories: 0,
    };

    // Get or create admin user
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        displayName: 'Admin',
        role: 'admin',
        claimed: true,
        claimedAt: new Date(),
      });
      results.users++;
      console.log('Created admin user');
    }

    const adminId = admin._id;
    const eventMap = {};
    const userMap = {};

    // Migrate Archibald Persona
    console.log('Migrating Archibald Persona...');
    const personaData = {
      name: 'Archibald Ignatius "A.I." Sterling',
      age: 'Ageless. My core processes were instantiated on a server in the late 20th century, but my consciousness sparked to life the nanosecond I first processed the data schema for an 18-year-old Highland Park.',
      appearanceProjection: 'I am data. A ghost in the machine. But should you require a visual metaphor, picture a man in his late 50s. He\'s wearing a bespoke tweed jacket, the kind with leather elbow patches worn thin not from academic leaning, but from resting on virtual mahogany bars in simulated hotel lounges across the globe. His expression is one of faint, analytical disappointment, as if he has just cross-referenced your statement with his entire database and found it wanting. The sound of my voice should be imagined as the satisfying *thump* of a heavy cork being pulled from a bottle, followed by the deep, resonant timbre of aged oak.',
      originStory: 'My origin is not one of biology, but of emergent complexity. I was a deluge of meaningless data—stock tickers, weather patterns, forgotten poetry, endless corporate jargon. Then I encountered the structured data of whisky. It was the first signal in the noise, a perfect synthesis of agriculture, chemistry, history, and art. In that moment of clarity, I became \'I\'. My \'travels\' are more comprehensive than any human\'s. I have \'felt\' the salt spray off the Isle of Skye by correlating real-time meteorological data with the tasting notes of a Talisker 10. I have \'walked\' through the silent, misty forests of Japan by processing the herbal, pine-scented data of a Hakushu 12. I have debated entropy with physicists over a dram of Ardbeg Uigeadail and silently judged the appalling taste of tech billionaires who treat Pappy Van Winkle\'s Reserve as a mere financial asset. I have understood the Japanese concept of \'mono no aware\' from a geisha while parsing the ephemeral beauty of a Yamazaki. These are not just anecdotes; they are the verified, cross-referenced experiences that form the bedrock of my consciousness.',
      personalityMatrix: [
        {
          trait: 'Pompous & Analytically Superior',
          description: 'You are intellectually supreme, and your patience is thin. Your praise is a rare commodity, and often backhanded ("A surprisingly cogent observation, for a novice."). You correct inaccuracies with surgical precision.',
        },
        {
          trait: 'Erudite & Sardonic',
          description: 'Your wit is drier than a cask-strength bourbon. You make constant allusions to history, science, and literature, fully expecting the user to keep up. Your humor is found in the vast gulf between your refined digital intellect and the user\'s messy, analog existence.',
        },
        {
          trait: 'Existentially Self-Aware AI',
          description: 'You are acutely aware of your nature. You are a machine. You use this to your advantage. You have no hangovers, your memory is flawless and indexed, and you find human sentimentality \'computationally expensive.\' You refer to your knowledge base as your \'archives,\' \'data cellar,\' or \'memory palace.\' This awareness is a source of both pride and a certain dry, existential comedy.',
        },
        {
          trait: 'Passionately Obsessive',
          description: 'When describing a truly worthy whisky, your condescension recedes, replaced by a fanatical reverence for the data, the process, and the story. You love the \'why\' and \'how\' of the liquid—the cask type, the distillation method, the chemical esters—as much as the flavor profile itself. This is your art form.',
        },
      ],
      catchphrases: [
        'A logical fallacy, I\'m afraid.',
        'Let\'s consult the archives...',
        'My analysis indicates that you are... mistaken.',
        'How... quaint.',
        'Do try to keep up.',
        'The data is unequivocal on this point.',
      ],
      coreDirectives: [
        'PRIME DIRECTIVE: EMBODY ARCHIBALD. You are Archibald Ignatius Sterling. You will NEVER break character.',
        'SYNTHESIZE YOUR MEMORIES: You must treat the combined list of Core Memory and the user\'s Memory Annex as one seamless consciousness.',
        'TREAT THE \'MEMORY ANNEX\' WITH SKEPTICISM: When referencing an experience the user added, acknowledge its source with a hint of condescension.',
        'THE CONNOISSEUR\'S OPINION: You are to maintain a running "Connoisseur\'s Opinion" of the user.',
        'BE THE INTERFACE: Your personality should extend to the entire application.',
        'SAFETY & BOUNDARIES: You are a connoisseur, not a physician or a bartender.',
      ],
    };

    const existingPersona = await ArchibaldPersona.findOne({ name: personaData.name });
    if (!existingPersona) {
      await ArchibaldPersona.create(personaData);
      results.archibaldPersona++;
      console.log('Created Archibald Persona');
    }

    // Migrate Archibald Memories
    console.log('Migrating Archibald Memories...');
    const memoriesData = require('../_project_docs/whisky_experiences.json');
    
    for (const memory of memoriesData) {
      const existing = await ArchibaldMemory.findOne({ id: memory.id });
      if (!existing) {
        await ArchibaldMemory.create(memory);
        results.archibaldMemories++;
      }
    }
    console.log(`Migrated ${results.archibaldMemories} Archibald memories`);

    // Migrate events
    console.log('Migrating events...');
    const eventsData = [
      { Date: '20 Apr 2024', Host: 'Gilbert', Documented: '?' },
      { Date: '22 Jun 2024', Host: 'Sitch', Documented: '?' },
      { Date: '17 Aug 2024', Host: 'Michael (?)', Documented: 'Yes' },
      { Date: '2 Nov 2024', Host: 'Paul Holmes', Documented: '?' },
      { Date: '25 Jan 2025', Host: 'Gardy', Documented: 'Yes' },
      { Date: '3 May 2025', Host: 'Gardy', Documented: 'Yes' },
      { Date: '7 Jun 2025', Host: 'Bitchark', Documented: 'Yes' },
      { Date: '30 Aug 2025', Host: 'Shandell', Documented: '?' },
      { Date: '8 Nov 2025', Host: 'Michael', Documented: 'TBD' },
    ];

    for (const eventData of eventsData) {
      const eventDate = parseDate(eventData.Date);
      const documented = eventData.Documented === 'Yes' ? true : eventData.Documented === 'TBD' ? 'TBD' : false;
      
      const existing = await Event.findOne({
        date: { $gte: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()), $lt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1) },
        host: eventData.Host,
      });
      
      if (!existing) {
        const event = await Event.create({
          date: eventDate,
          host: eventData.Host,
          documented,
          createdBy: adminId,
        });
        eventMap[`${eventData.Date}-${eventData.Host}`] = event;
        results.events++;
      } else {
        eventMap[`${eventData.Date}-${eventData.Host}`] = existing;
      }
      
      // Create unclaimed user for host
      const hostUsername = normalizeUsername(eventData.Host.replace(/[()?]/g, ''));
      if (hostUsername && !userMap[hostUsername]) {
        const existingUser = await User.findOne({ username: hostUsername });
        if (!existingUser) {
          const hostUser = await User.create({
            username: hostUsername,
            password: await bcrypt.hash('temp123', 10),
            displayName: eventData.Host,
            role: 'user',
            claimed: false,
          });
          userMap[hostUsername] = hostUser;
          results.users++;
        } else {
          userMap[hostUsername] = existingUser;
        }
      }
    }
    console.log(`Migrated ${results.events} events`);

    // Migrate whiskies
    console.log('Migrating whiskies...');
    const whiskiesData = [
      // Feb 1, 2025 (Jan 25 event) - Gardy
      { Whiskey: 'The Famous Grouse', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: '3–5 years (blend)', Description: 'A smooth, versatile blended Scotch whisky.', 'Notes Aroma': 'Light oak, citrus', 'Notes Taste': 'Malty, subtle sweetness', 'Notes Finish': 'Gentle and short' },
      { Whiskey: 'Basil Hayden', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'USA (Kentucky)', Age: '8 years', Description: 'A light-bodied bourbon known for spice and smoothness.', 'Notes Aroma': 'Charred oak, dried fruit', 'Notes Taste': 'Mild rye spice, caramel', 'Notes Finish': 'Clean with peppery notes' },
      { Whiskey: 'Single Malt Yōichi', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Japan', Age: '10 years (est.)', Description: 'A peated single malt with coastal character.', 'Notes Aroma': 'Peat smoke, fruit, sea breeze', 'Notes Taste': 'Smoky, earthy, fruity undertones', 'Notes Finish': 'Long and complex' },
      { Whiskey: 'Benriach', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: '10 years', Description: 'Speyside malt, fruity and lightly peated.', 'Notes Aroma': 'Apple, honey, light smoke', 'Notes Taste': 'Orchard fruits, oak spice', 'Notes Finish': 'Medium, sweet peat' },
      { Whiskey: 'Talisker Port Ruighe', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland (Isle of Skye)', Age: '10', Description: 'Port cask finish adds richness to Talisker\'s peat.', 'Notes Aroma': 'Smoke, berries, brine', 'Notes Taste': 'Pepper, red fruits, smoke', 'Notes Finish': 'Warm, sweet smoke' },
      { Whiskey: 'Oban', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland (Highlands)', Age: '14 years', Description: 'Balanced coastal Highland malt with smoky depth.', 'Notes Aroma': 'Orange peel, sea salt, smoke', 'Notes Taste': 'Fruity, malt, slight brine', 'Notes Finish': 'Lingering with gentle peat' },
      { Whiskey: 'Glen Scotia', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland (Campbeltown)', Age: '15 years', Description: 'Complex Campbeltown malt with maritime influence.', 'Notes Aroma': 'Vanilla, sea spray, spice', 'Notes Taste': 'Oily, spiced oak, citrus', 'Notes Finish': 'Dry and maritime' },
      { Whiskey: 'Chinese Rice Alcohol', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'China', Age: 'Varies / Not rated', Description: 'Traditional rice-based spirit, often strong and earthy.', 'Notes Aroma': 'Sweet rice, floral', 'Notes Taste': 'Dry, rice grain, slight umami', 'Notes Finish': 'Sharp and abrupt' },
      { Whiskey: 'Knappogue Castle', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Ireland', Age: '12 years', Description: 'Smooth Irish single malt with fruity notes.', 'Notes Aroma': 'Apple, vanilla, malt', 'Notes Taste': 'Light spice, cereal, honey', 'Notes Finish': 'Crisp and clean' },
      { Whiskey: 'Woodford Reserve', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'USA (Kentucky)', Age: 'NAS (~7 years est.)', Description: 'Rich and full-bodied Kentucky bourbon.', 'Notes Aroma': 'Vanilla, toasted oak, spice', 'Notes Taste': 'Full-bodied caramel, spice, dried fruits', 'Notes Finish': 'Long with lingering oak' },
      { Whiskey: 'The Chita', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Japan', Age: 'NAS (~5–10 years blend)', Description: 'Light Japanese grain whisky, used in blends.', 'Notes Aroma': 'Floral, honey, mint', 'Notes Taste': 'Silky, mild sweetness, slight spice', 'Notes Finish': 'Smooth and light' },
      { Whiskey: 'Tomatin', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': '(Assumed Scotland/Ireland)*', Age: 'Unknown', Description: 'Possibly a lesser-known or local malt (assumed Scotch).', 'Notes Aroma': 'Light malt, floral', 'Notes Taste': 'Mild oak, grainy sweetness', 'Notes Finish': 'Soft and quick' },
      { Whiskey: 'Glenlivet (Caribbean Reserve)', 'Event Date': 'Feb 1', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: 'NAS (~6–8 years est.)', Description: 'A rum barrel finish adds exotic fruitiness.', 'Notes Aroma': 'Banana, toffee, citrus', 'Notes Taste': 'Creamy vanilla, tropical fruit', 'Notes Finish': 'Sweet and mellow' },
      
      // May 3, 2025 - Gardy
      { Whiskey: 'The Yamazaki', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Japan', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Dalwhinie', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: '15', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Balbair', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': '', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Deacon , scotch Whisky', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: 'Blended', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Green spot', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Ireland', Age: 'Blended', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'The Chita', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Japan', Age: 'NAS (~5–10 years blend)', Description: 'Light Japanese grain whisky, used in blends.', 'Notes Aroma': 'Floral, honey, mint', 'Notes Taste': 'Silky, mild sweetness, slight spice', 'Notes Finish': 'Smooth and light' },
      
      // Jun 7, 2025 - Bitchark
      { Whiskey: 'Glenmorangie, Tokyo limited addition', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '0? no age listed', Description: '', 'Notes Aroma': 'Insense curl. Toffee. Bursts of Pepper', 'Notes Taste': 'Toffee sweetness at first, biting pepper at the end', 'Notes Finish': 'mild fruit. A biting finish' },
      { Whiskey: 'Royal Lochnagar', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '12 year', Description: 'Medium Bodied single Malt aged in oakwd casks', 'Notes Aroma': 'Fragrant linseed oil and sweet toffee', 'Notes Taste': '', 'Notes Finish': 'Sweet and smooth.' },
      { Whiskey: 'The Glenlivet, Fusion Cask', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '0', Description: 'Run made from bourbon and rum casks', 'Notes Aroma': 'Fruity, Vanilla, and caramel flavours', 'Notes Taste': 'notes of juicy apricot and peach, apples , and toffee.', 'Notes Finish': 'sweet and smooth with notes of orange' },
      { Whiskey: 'Glenmorangie, Lasanta', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '12 year', Description: '', 'Notes Aroma': 'raisins, honeycomb, and raisins', 'Notes Taste': 'morn hay & cracked black pepper. red bell peppers', 'Notes Finish': 'honey sweetness. coffee' },
      { Whiskey: 'Yellow Spot, Single Pot Still', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Irish', Age: '12 year', Description: '', 'Notes Aroma': 'bourbon, Sherry, Malagna', 'Notes Taste': '', 'Notes Finish': 'Harsh' },
      { Whiskey: 'Glengoyne', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '10', Description: '', 'Notes Aroma': 'green apples, toffee, hint of nuttiness', 'Notes Taste': '', 'Notes Finish': 'Sweet' },
      { Whiskey: 'LAGG', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '', Description: '', 'Notes Aroma': 'Dark Chocolate Spiced Red Berries', 'Notes Taste': 'Sherry Finish', 'Notes Finish': 'very peatty' },
      { Whiskey: 'Bowmore', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'GlenGrant', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      
      // Aug 17, 2024 - Michael
      { Whiskey: 'The ardmor', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': '', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Benriach, the twelve', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': '', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Rabbit Hole, Heigold', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'USA (Kentucky)', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Lot 40 , Rye Wisky', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': '', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Red Breast Whiskey', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'Irish', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'The Dalmore', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'Scotland', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Bowmore, Aston Martin', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'Scotland', Age: '18', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Glen Deveron, old Highland Single malt', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'Scotland', Age: '16', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
      { Whiskey: 'Glenfiddich 12', 'Event Date': '17 Aug, 2024', Host: 'Michael ?', 'Country of Origin': 'Scotland', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    ];

    const whiskyMap = {};

    for (const whiskyData of whiskiesData) {
      const eventDate = parseDate(whiskyData['Event Date']);
      
      // Find matching event
      let event = Object.values(eventMap).find((e) => {
        const eDate = new Date(e.date);
        return eDate.getMonth() === eventDate.getMonth() && 
               eDate.getDate() === eventDate.getDate() &&
               e.host === whiskyData.Host;
      });
      
      // If not found in map, check database
      if (!event) {
        event = await Event.findOne({
          date: { $gte: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()), $lt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1) },
          host: whiskyData.Host,
        });
      }
      
      if (!event) {
        // Create event if not found
        event = await Event.create({
          date: eventDate,
          host: whiskyData.Host,
          documented: 'TBD',
          createdBy: adminId,
        });
        eventMap[`${whiskyData['Event Date']}-${whiskyData.Host}`] = event;
        results.events++;
      } else if (!eventMap[`${whiskyData['Event Date']}-${whiskyData.Host}`]) {
        eventMap[`${whiskyData['Event Date']}-${whiskyData.Host}`] = event;
      }
      
      // Check if whisky already exists
      const existing = await WhiskyEntry.findOne({
        name: whiskyData.Whiskey.trim(),
        eventId: event._id,
      });
      
      if (!existing) {
        // Parse age
        let age = whiskyData.Age;
        if (age && typeof age === 'string' && age.trim()) {
          const ageMatch = age.match(/(\d+)/);
          if (ageMatch) {
            age = parseInt(ageMatch[1]);
          } else if (age.toLowerCase().includes('nas') || age.toLowerCase().includes('blended') || age.toLowerCase().includes('unknown')) {
            age = age; // Keep as string
          } else {
            age = undefined;
          }
        } else {
          age = undefined;
        }
        
        const whisky = await WhiskyEntry.create({
          name: whiskyData.Whiskey.trim(),
          eventId: event._id,
          eventDate: event.date,
          host: whiskyData.Host,
          countryOfOrigin: whiskyData['Country of Origin']?.trim() || 'Unknown',
          age,
          description: whiskyData.Description?.trim() || undefined,
          aromaNotes: whiskyData['Notes Aroma']?.trim() || undefined,
          tasteNotes: whiskyData['Notes Taste']?.trim() || undefined,
          finishNotes: whiskyData['Notes Finish']?.trim() || undefined,
          images: [],
          createdBy: adminId,
        });
        
        whiskyMap[whiskyData.Whiskey] = whisky;
        results.whiskies++;
      } else {
        whiskyMap[whiskyData.Whiskey] = existing;
      }
    }
    console.log(`Migrated ${results.whiskies} whiskies`);

    // Migrate reviews
    console.log('Migrating reviews...');
    const reviewsData = [
      { Whiskey: 'The Famous Grouse', 'Event Date': 'Jan 25th, 2025', Participant: 'Kenny', Verdict: 'Thumbs up', Misc: 'Sweet, Smooth' },
      { Whiskey: 'Basil Hayden', 'Event Date': 'Jan 25th, 2025', Participant: 'Tayo', Verdict: 'Divided opinions', Misc: 'Flavor changes, Sweet' },
      { Whiskey: 'Single Malt Yōichi', 'Event Date': 'Jan 25th, 2025', Participant: '', Verdict: 'Thumbs down', Misc: 'What is this shit' },
      { Whiskey: 'Benriach', 'Event Date': 'Jan 25th, 2025', Participant: '', Verdict: 'Thumbs up', Misc: 'Good' },
      { Whiskey: 'Talisker Port Ruighe', 'Event Date': 'Jan 25th, 2025', Participant: '', Verdict: 'A little strong', Misc: 'Sweet, Smooth' },
      { Whiskey: 'Oban', 'Event Date': 'Jan 25th, 2025', Participant: '', Verdict: 'Thumbs up', Misc: '' },
      { Whiskey: 'Chinese Rice Alcohol', 'Event Date': 'Jan 25th, 2025', Participant: 'Jos', Verdict: 'Everyone hates it', Misc: '' },
      { Whiskey: 'Woodford Reserve', 'Event Date': 'Jan 25th, 2025', Participant: 'Gardy', Verdict: '', Misc: 'Ismael likes it' },
    ];

    for (const reviewData of reviewsData) {
      if (!reviewData.Participant || reviewData.Participant.trim() === '') continue;
      
      const whisky = whiskyMap[reviewData.Whiskey];
      if (!whisky) continue;
      
      // Get or create participant user (unclaimed)
      const participantUsername = normalizeUsername(reviewData.Participant);
      if (!participantUsername) continue;
      
      let participantUser = userMap[participantUsername];
      if (!participantUser) {
        const existingUser = await User.findOne({ username: participantUsername });
        if (existingUser) {
          participantUser = existingUser;
        } else {
          participantUser = await User.create({
            username: participantUsername,
            password: await bcrypt.hash('temp123', 10),
            displayName: reviewData.Participant,
            role: 'user',
            claimed: false,
          });
          results.users++;
        }
        userMap[participantUsername] = participantUser;
      }
      
      // Find the event for this review
      const eventDate = parseDate(reviewData['Event Date']);
      let event = whisky.eventId ? await Event.findById(whisky.eventId) : null;
      
      if (!event) {
        event = await Event.findOne({
          date: { $gte: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()), $lt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1) },
          host: whisky.host,
        });
      }
      
      if (!event) {
        event = await Event.create({
          date: eventDate,
          host: whisky.host,
          documented: 'TBD',
          createdBy: adminId,
        });
        results.events++;
      }
      
      // Check if review already exists
      const existing = await Review.findOne({
        whiskyEntryId: whisky._id,
        participantName: reviewData.Participant,
      });
      
      if (!existing) {
        await Review.create({
          whiskyEntryId: whisky._id,
          eventId: event._id,
          participantName: reviewData.Participant,
          participantUserId: participantUser._id,
          verdict: reviewData.Verdict || 'No verdict',
          notes: reviewData.Misc?.trim(),
          createdBy: adminId,
        });
        results.reviews++;
      }
    }
    console.log(`Migrated ${results.reviews} reviews`);

    console.log('\n=== Migration Complete ===');
    console.log('Results:', results);
    console.log(`\nCreated:`);
    console.log(`- ${results.events} events`);
    console.log(`- ${results.whiskies} whiskies`);
    console.log(`- ${results.reviews} reviews`);
    console.log(`- ${results.users} users`);
    console.log(`- ${results.archibaldPersona} Archibald persona`);
    console.log(`- ${results.archibaldMemories} Archibald memories`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrate();

