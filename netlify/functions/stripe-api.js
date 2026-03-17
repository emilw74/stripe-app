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

    // 1. Pobieranie Wypłat
    const payoutsResponse = await fetch(`https://api.stripe.com/v1/payouts?created[gte]=${startTimestamp}&created[lte]=${endTimestamp}&limit=100`, { headers: stripeHeaders });
    if (!payoutsResponse.ok) throw new Error('Błąd pobierania wypłat ze Stripe. Upewnij się, że klucz API jest poprawny.');
    
    const payoutsData = await payoutsResponse.json();
    const fullReport = [];

    // 2. Pobieranie transakcji dla każdej wypłaty
    for (const payout of payoutsData.data) {
      const btResponse = await fetch(`https://api.stripe.com/v1/balance_transactions?payout=${payout.id}&limit=100&expand[]=data.source`, { headers: stripeHeaders });
      const btData = await btResponse.json();
      
      fullReport.push({
        payoutId: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
        arrivalDate: payout.arrival_date,
        status: payout.status,
        description: payout.description,
        transactions: btData.data.map(bt => ({
          id: bt.id,
          type: bt.type,
          amount: bt.amount / 100,
          fee: bt.fee / 100,
          net: bt.net / 100,
          created: bt.created,
          description: bt.description || (bt.source && bt.source.description) || 'Brak opisu'
        }))
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify(fullReport) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};


