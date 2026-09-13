import 'dotenv/config';

async function runSeed() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`Calling seed API at ${appUrl}/api/seed ...`);
  try {
    const res = await fetch(`${appUrl}/api/seed`, { method: 'POST' });
    const data = await res.json();
    console.log('Seed response:', data);
  } catch (err) {
    console.error('Failed to trigger seed API:', err);
  }
}

runSeed();
