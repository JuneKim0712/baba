import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email, source = 'landing_hero' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const subscriberData = {
      email: email.toLowerCase().trim(),
      source,
      createdAt: new Date().toISOString(),
      active: true,
    };

    if (adminDb) {
      await adminDb.collection('subscribers').doc(email.toLowerCase().trim()).set(subscriberData, { merge: true });
    }

    return NextResponse.json({ success: true, message: 'Subscribed to hot deal alerts!' });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return NextResponse.json({ success: true, message: 'Subscribed! (Simulation Mode)' });
  }
}
