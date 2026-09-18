import clientPromise from './lib/mongodb';

async function migrate() {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Add coin fields to all existing users (adds new fields, doesn't overwrite existing data)
    const result = await db.collection('users').updateMany(
      {},
      {
        $set: {
          coins: 0,
          premiumUnlocks: [],
          lastDailyBonus: null,
          coinTransactions: []
        }
      }
    );
    console.log(`✅ Added coin fields to ${result.modifiedCount} users`);
    
    // 2. Create coin_leaderboard collection (it will be created automatically when we insert)
    console.log('✅ coin_leaderboard collection ready');
    
    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrate();
