/**
 * Data migration script
 * Migrates data from WhiskyEventSheet.txt structure to MongoDB
 * 
 * Run with: npm run migrate
 * Or: npx tsx src/scripts/migrateData.ts
 */

import connectDB from '../lib/db';
import Event from '../lib/models/Event';
import WhiskyEntry from '../lib/models/WhiskyEntry';
import Review from '../lib/models/Review';
import User from '../lib/models/User';
import { hashPassword } from '../lib/auth';

interface WhiskyRow {
  Whiskey: string;
  'Event Date': string;
  Host: string;
  'Country of Origin': string;
  Age?: string;
  Description?: string;
  'Notes Aroma'?: string;
  'Notes Taste'?: string;
  'Notes Finish'?: string;
}

interface ReviewRow {
  Whiskey: string;
  'Event Date': string;
  Participant: string;
  Verdict: string;
  Misc?: string;
}

interface EventRow {
  Date: string;
  Host: string;
  Documented: string;
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  // Handle various date formats from the sheet
  // "Feb 1" -> assume current year or use event date
  // "Jan 25th, 2025" -> parse properly
  // "17 Aug, 2024" -> parse properly
  
  const cleaned = dateStr.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try parsing formats like "Jan 25th, 2025" or "17 Aug, 2024"
  const dateMatch = cleaned.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      return new Date(parseInt(year), monthNum, parseInt(day));
    }
  }
  
  // Try format like "Feb 1" (assume current year)
  const shortMatch = cleaned.match(/(\w+)\s+(\d+)/i);
  if (shortMatch) {
    const [, month, day] = shortMatch;
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      const year = new Date().getFullYear();
      return new Date(year, monthNum, parseInt(day));
    }
  }
  
  // Fallback to current date
  console.warn(`Could not parse date: ${dateStr}, using current date`);
  return new Date();
}

/**
 * Create or get admin user
 */
async function getOrCreateAdminUser() {
  await connectDB();
  
  let admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    admin = await User.create({
      username: 'admin',
      password: await hashPassword('admin123'), // Change this!
      displayName: 'Admin',
      role: 'admin',
    });
    console.log('Created admin user');
  }
  
  return admin;
}

/**
 * Create or get user by name
 */
async function getOrCreateUser(name: string) {
  await connectDB();
  
  const username = name.toLowerCase().replace(/\s+/g, '');
  let user = await User.findOne({ username });
  
  if (!user) {
    user = await User.create({
      username,
      password: await hashPassword('temp123'), // Temporary password
      displayName: name,
      role: 'user',
    });
    console.log(`Created user: ${name} (${username})`);
  }
  
  return user;
}

/**
 * Migrate events from sheet data
 */
async function migrateEvents(adminId: string) {
  await connectDB();
  
  // Event data from sheet
  const eventsData: EventRow[] = [
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
  
  const createdEvents: Record<string, unknown> = {};
  
  for (const eventData of eventsData) {
    const eventDate = parseDate(eventData.Date);
    const documented = eventData.Documented === 'Yes' ? true : eventData.Documented === 'TBD' ? 'TBD' : false;
    
    // Check if event already exists
    const existing = await Event.findOne({
      date: eventDate,
      host: eventData.Host,
    });
    
    if (!existing) {
      const event = await Event.create({
        date: eventDate,
        host: eventData.Host,
        documented,
        createdBy: adminId,
      });
      
      const key = `${eventData.Date}-${eventData.Host}`;
      createdEvents[key] = event;
      console.log(`Created event: ${eventData.Host} on ${eventData.Date}`);
    } else {
      const key = `${eventData.Date}-${eventData.Host}`;
      createdEvents[key] = existing;
    }
  }
  
  return createdEvents;
}

/**
 * Migrate whisky entries from sheet data
 */
async function migrateWhiskies(events: Record<string, unknown>, adminId: string) {
  await connectDB();
  
  // Whisky data from sheet - simplified structure
  const whiskiesData: WhiskyRow[] = [
    // Feb 1, Gardy event
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
    
    // May 3, Gardy event
    { Whiskey: 'The Yamazaki', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Japan', Age: '', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    { Whiskey: 'Dalwhinie', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: '15', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    { Whiskey: 'Balbair', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': '', Age: '12', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    { Whiskey: 'Deacon , scotch Whisky', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Scotland', Age: 'Blended', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    { Whiskey: 'Green spot', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Ireland', Age: 'Blended', Description: '', 'Notes Aroma': '', 'Notes Taste': '', 'Notes Finish': '' },
    { Whiskey: 'The Chita', 'Event Date': 'May 3', Host: 'Gardy', 'Country of Origin': 'Japan', Age: 'NAS (~5–10 years blend)', Description: 'Light Japanese grain whisky, used in blends.', 'Notes Aroma': 'Floral, honey, mint', 'Notes Taste': 'Silky, mild sweetness, slight spice', 'Notes Finish': 'Smooth and light' },
    
    // Jun 7, Bitchark event
    { Whiskey: 'Glenmorangie, Tokyo limited addition', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '0? no age listed', Description: '', 'Notes Aroma': 'Insense curl. Toffee. Bursts of Pepper', 'Notes Taste': 'Toffee sweetness at first, biting pepper at the end', 'Notes Finish': 'mild fruit. A biting finish' },
    { Whiskey: 'Royal Lochnagar', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '12 year', Description: 'Medium Bodied single Malt aged in oakwd casks', 'Notes Aroma': 'Fragrant linseed oil and sweet toffee', 'Notes Taste': '', 'Notes Finish': 'Sweet and smooth.' },
    { Whiskey: 'The Glenlivet, Fusion Cask', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '0', Description: 'Run made from bourbon and rum casks', 'Notes Aroma': 'Fruity, Vanilla, and caramel flavours', 'Notes Taste': 'notes of juicy apricot and peach, apples , and toffee.', 'Notes Finish': 'sweet and smooth with notes of orange' },
    { Whiskey: 'Glenmorangie, Lasanta', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '12 year', Description: '', 'Notes Aroma': 'raisins, honeycomb, and raisins', 'Notes Taste': 'morn hay & cracked black pepper. red bell peppers', 'Notes Finish': 'honey sweetness. coffee' },
    { Whiskey: 'Yellow Spot, Single Pot Still', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Irish', Age: '12 year', Description: '', 'Notes Aroma': 'bourbon, Sherry, Malagna', 'Notes Taste': '', 'Notes Finish': 'Harsh' },
    { Whiskey: 'Glengoyne', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '10', Description: '', 'Notes Aroma': 'green apples, toffee, hint of nuttiness', 'Notes Taste': '', 'Notes Finish': 'Sweet' },
    { Whiskey: 'LAGG', 'Event Date': '7 Jun 2025', Host: 'Bitchark', 'Country of Origin': 'Scotland', Age: '', Description: '', 'Notes Aroma': 'Dark Chocolate Spiced Red Berries', 'Notes Taste': 'Sherry Finish', 'Notes Finish': 'very peatty' },
    
    // Aug 17, Michael event
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
  
  const createdWhiskies: Record<string, unknown> = {};
  
  for (const whiskyData of whiskiesData) {
    const eventDate = parseDate(whiskyData['Event Date']);
    const eventKey = Object.keys(events).find((key) => {
      const [date, host] = key.split('-');
      return host === whiskyData.Host || date.includes(whiskyData['Event Date'].split(' ')[0]);
    });
    
    let event = eventKey ? events[eventKey] : null;
    
    // If no exact match, find or create event
    if (!event) {
      const existingEvent = await Event.findOne({
        host: whiskyData.Host,
        date: { $gte: new Date(eventDate.getFullYear(), 0, 1), $lt: new Date(eventDate.getFullYear() + 1, 0, 1) }
      });
      
      if (existingEvent) {
        event = existingEvent;
      } else {
        event = await Event.create({
          date: eventDate,
          host: whiskyData.Host,
          documented: 'TBD',
          createdBy: adminId,
        });
        console.log(`Created event for whisky: ${whiskyData.Host} on ${whiskyData['Event Date']}`);
      }
    }
    
    if (!event) {
      continue; // Skip if event still not found
    }
    
    const eventData = event as { _id: unknown; date: Date; host: string };
    
    // Check if whisky already exists
    const existing = await WhiskyEntry.findOne({
      name: whiskyData.Whiskey.trim(),
      eventId: eventData._id,
    });
    
    if (!existing) {
      // Parse age
      let age: string | number | undefined = whiskyData.Age;
      if (age && typeof age === 'string') {
        const ageMatch = age.match(/(\d+)/);
        if (ageMatch) {
          age = parseInt(ageMatch[1]);
        }
      }
      
        const whisky = await WhiskyEntry.create({
          name: whiskyData.Whiskey.trim(),
          eventId: eventData._id,
          eventDate: eventData.date,
          host: whiskyData.Host,
        countryOfOrigin: whiskyData['Country of Origin'] || 'Unknown',
        age,
        description: whiskyData.Description?.trim(),
        aromaNotes: whiskyData['Notes Aroma']?.trim(),
        tasteNotes: whiskyData['Notes Taste']?.trim(),
        finishNotes: whiskyData['Notes Finish']?.trim(),
        images: [],
        createdBy: adminId,
      });
      
      createdWhiskies[whiskyData.Whiskey] = whisky;
      console.log(`Created whisky: ${whiskyData.Whiskey}`);
    } else {
      createdWhiskies[whiskyData.Whiskey] = existing;
    }
  }
  
  return createdWhiskies;
}

/**
 * Migrate reviews from sheet data
 */
async function migrateReviews(whiskies: Record<string, unknown>, events: Record<string, unknown>, adminId: string) {
  await connectDB();
  
  // Review data from sheet
  const reviewsData: ReviewRow[] = [
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
    if (!reviewData.Participant) continue;
    
    const whisky = whiskies[reviewData.Whiskey] as { _id: unknown; eventId: unknown; host: string } | undefined;
    if (!whisky) {
      continue;
    }
    
    const event = whisky.eventId;
    
    // Get or create participant user
    const participant = await getOrCreateUser(reviewData.Participant);
    
    // Check if review already exists
    const existing = await Review.findOne({
      whiskyEntryId: whisky._id,
      participantName: reviewData.Participant,
    });
    
    if (!existing) {
      await Review.create({
        whiskyEntryId: whisky._id,
        eventId: event,
        participantName: reviewData.Participant,
        participantUserId: participant._id,
        verdict: reviewData.Verdict || 'No verdict',
        notes: reviewData.Misc?.trim(),
        createdBy: adminId,
      });
      console.log(`Created review: ${reviewData.Participant} - ${reviewData.Verdict} for ${reviewData.Whiskey}`);
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('Starting data migration...');
    
    await connectDB();
    
    // Get or create admin user
    const admin = await getOrCreateAdminUser();
    
    // Migrate events
    console.log('Migrating events...');
    const events = await migrateEvents(admin._id.toString());
    console.log(`Migrated ${Object.keys(events).length} events`);
    
    // Migrate whiskies
    console.log('Migrating whiskies...');
    const whiskies = await migrateWhiskies(events, admin._id.toString());
    console.log(`Migrated ${Object.keys(whiskies).length} whiskies`);
    
    // Migrate reviews
    console.log('Migrating reviews...');
    await migrateReviews(whiskies, events, admin._id.toString());
    console.log('Migration complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export default migrate;

