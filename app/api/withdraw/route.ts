import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { amount, bank_name, account_number, account_name } = body;

    // 1. Check wallet balance
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 2. Create withdrawal request
    const { data: withdrawal, error: dbError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount,
        bank_name,
        account_number,
        account_name,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. DEDUCT BALANCE IMMEDIATELY (Hold in escrow)
    await supabase.from('wallets').update({ balance: wallet.balance - amount }).eq('user_id', user.id);

    // 4. TODO: INTEGRATE PAYSTACK/STRIPE TRANSFER HERE
    // Example: const payout = await paystack.transfer.initiate({ amount, recipient: account_number });
    // If payout fails, you would refund the balance and update status to 'failed'.

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}