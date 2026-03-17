exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { apiKey, startDate, endDate } = JSON.parse(event.body);
    if (!apiKey) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Brak klucza API' }) };

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000) + 86400;

    const stripeHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // 1. Pobieranie Wypłat (Payouts) na konto bankowe
    const payoutsResponse = await fetch(`https://api.stripe.com/v1/payouts?created[gte]=${startTimestamp}&created[lte]=${endTimestamp}&limit=100`, { headers: stripeHeaders });
    
    if (!payoutsResponse.ok) {
      const err = await payoutsResponse.json();
      throw new Error(err.error.message || 'Błąd uwierzytelniania w Stripe.');
    }
    
    const payoutsData = await payoutsResponse.json();
    const fullReport = [];

    // 2. Pobieranie transakcji składowych (z paginacją dla dużej ilości wpłat)
    for (const payout of payoutsData.data) {
      let allTransactions = [];
      let hasMore = true;
      let startingAfter = undefined;

      while(hasMore) {
        let url = `https://api.stripe.com/v1/balance_transactions?payout=${payout.id}&limit=100&expand[]=data.source`;
        if (startingAfter) url += `&starting_after=${startingAfter}`;
        
        const btResponse = await fetch(url, { headers: stripeHeaders });
        const btData = await btResponse.json();
        
        allTransactions = allTransactions.concat(btData.data);
        hasMore = btData.has_more;
        if (hasMore) {
           startingAfter = btData.data[btData.data.length - 1].id;
        }
      }
      
      fullReport.push({
        payoutId: payout.id,
        amount: payout.amount / 100, // Kwota przelewu AA
        currency: payout.currency,
        arrivalDate: payout.arrival_date,
        status: payout.status,
        transactions: allTransactions
          .filter(bt => bt.type !== 'payout') // <-- CAŁKOWICIE omijamy techniczne wpisy Stripe Payout
          .map(bt => ({
            id: bt.id,
            type: bt.type,
            amount: bt.amount / 100,
            fee: bt.fee / 100,
            net: bt.net / 100, // Kwota BB
            created: bt.created,
            description: bt.description || (bt.source && bt.source.description) || 'Transakcja płatnicza'
          }))
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify(fullReport) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};


